'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  AlertCircle,
  HashIcon,
  ImagePlus,
  Loader2,
  PlusCircle,
  RotateCcw,
  Send,
  Trash2,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  getCommunityTopicSuggestions,
  quickCreateCommunityTopic,
  type CommunityTopicItem,
} from '@/lib/community-api';
import {
  DEFAULT_COMMUNITY_CONFIG,
  normalizeCommunityConfig,
  type CommunityRuntimeConfig,
} from '@/lib/community-config';
import {
  clearDraft,
  deleteDraftImage,
  putDraftImage,
  pruneExpiredDrafts,
  readDraft,
  readDraftImages,
  resolveDraftKey,
  writeDraft,
  type CommunityDraft,
} from '@/lib/community-draft';
import {
  deletePublishJob,
  processPublishQueue,
  savePublishJob,
  subscribePublishQueue,
  uploadCommunityPostImage,
  type CommunityPublishImage,
  type CommunityPublishJob,
} from '@/lib/community-publish-queue';
import { cn } from '@/lib/utils';

const CommunityEditor = dynamic(() => import('./CommunityEditor'), {
  ssr: false,
});
const AuthModal = dynamic(() => import('@/components/auth/auth-modal'), {
  ssr: false,
});

interface CreatePostFormProps {
  communityConfig?: Partial<CommunityRuntimeConfig>;
  forcedAppId?: string;
  initialContent?: string;
  initialTitle?: string;
  initialTopics?: CommunityTopicItem[];
  mode?: 'create' | 'edit';
  onCancel?: () => void;
  onPosted?: () => void;
  onSubmitPost?: (payload: {
    appId?: string;
    content: string;
    source: string;
    title?: string;
    topicIds?: string[];
    topicNames?: string[];
  }) => Promise<{
    message: string;
    ok: boolean;
    postId?: string;
  }>;
  selectedTopic?: CommunityTopicItem | null;
  submitLabel?: string;
  submittingLabel?: string;
  surface?: 'card' | 'plain';
  shouldAutoFocus?: boolean;
  onAutoFocusHandled?: () => void;
}

interface LocalImage {
  blob: Blob;
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

const MAX_TOPIC_NAME_LENGTH = 24;
const AUTOSAVE_DELAY_MS = 800;

function createId(prefix: string) {
  const cryptoObject = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObject && typeof cryptoObject.randomUUID === 'function') {
    return cryptoObject.randomUUID();
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function extractHashtagNames(text: string): string[] {
  const source = String(text || '');
  const regex = /#([^\s#]{1,24})/g;
  const result = new Set<string>();
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(source)) !== null) {
    const name = String(match[1] || '').trim();
    if (name) result.add(name);
  }
  return Array.from(result);
}

function countMarkdownImages(text: string) {
  return (String(text || '').match(/!\[[^\]]*\]\(/g) || []).length;
}

function upsertTopic(
  list: CommunityTopicItem[],
  item: CommunityTopicItem,
): CommunityTopicItem[] {
  const id = String(item?._id || '').trim();
  if (!id) return list;
  if (list.some((topic) => String(topic._id) === id)) return list;
  return [...list, item];
}

function normalizeTopicList(
  input: CommunityTopicItem[] | undefined,
): CommunityTopicItem[] {
  const result: CommunityTopicItem[] = [];
  for (const topic of input || []) {
    const id = String(topic?._id || '').trim();
    if (!id) continue;
    if (result.some((item) => String(item._id || '').trim() === id)) continue;
    result.push({
      ...topic,
      _id: id,
      app_id: String(topic?.app_id || '').trim() || undefined,
      name: String(topic?.name || '').trim() || id,
      slug: String(topic?.slug || '').trim() || id,
    });
  }
  return result;
}

function formatDraftTime(timestamp: number) {
  try {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function CreatePostForm({
  communityConfig,
  forcedAppId,
  initialContent = '',
  initialTitle = '',
  initialTopics,
  mode = 'create',
  onCancel,
  onPosted,
  onSubmitPost,
  selectedTopic,
  submitLabel,
  submittingLabel,
  surface = 'card',
  shouldAutoFocus = false,
  onAutoFocusHandled,
}: CreatePostFormProps) {
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const config = useMemo(
    () => normalizeCommunityConfig({ ...DEFAULT_COMMUNITY_CONFIG, ...communityConfig }),
    [communityConfig],
  );

  const [title, setTitle] = useState(() => String(initialTitle || ''));
  const [content, setContent] = useState(() => String(initialContent || ''));
  const [editorMarkdown, setEditorMarkdown] = useState(() => String(initialContent || ''));
  const [editorKey, setEditorKey] = useState(0);
  const [editorOpen, setEditorOpen] = useState(
    () => mode === 'edit' || Boolean(String(initialContent || '').trim()),
  );
  const [selectedTopics, setSelectedTopics] = useState<CommunityTopicItem[]>(
    () => normalizeTopicList(initialTopics),
  );
  const [topicQuery, setTopicQuery] = useState('');
  const [topicSuggestions, setTopicSuggestions] = useState<CommunityTopicItem[]>([]);
  const [isSuggestingTopic, setIsSuggestingTopic] = useState(false);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [draftCandidate, setDraftCandidate] = useState<CommunityDraft | null>(null);
  const [isReadingDraft, setIsReadingDraft] = useState(false);

  const imagesRef = useRef(new Map<string, LocalImage>());
  const draftKey = useMemo(() => resolveDraftKey(user?._id), [user?._id]);

  const resolvedAppId = useMemo(() => {
    const fixedAppId = String(forcedAppId || '').trim();
    if (fixedAppId) return fixedAppId;
    const selectedAppId = String(selectedTopic?.app_id || '').trim();
    if (selectedAppId) return selectedAppId;
    for (const topic of selectedTopics) {
      const topicAppId = String(topic?.app_id || '').trim();
      if (topicAppId) return topicAppId;
    }
    return '';
  }, [forcedAppId, selectedTopic, selectedTopics]);

  const imageCount = useMemo(() => countMarkdownImages(content), [content]);

  useEffect(() => {
    if (!selectedTopic?._id) return;
    setSelectedTopics((prev) => upsertTopic(prev, selectedTopic));
  }, [selectedTopic]);

  useEffect(() => {
    if (!shouldAutoFocus) return;
    setEditorOpen(true);
    onAutoFocusHandled?.();
  }, [onAutoFocusHandled, shouldAutoFocus]);

  useEffect(() => {
    if (mode === 'edit') return;
    void pruneExpiredDrafts();
    const draft = readDraft(draftKey);
    if (draft && (draft.title.trim() || draft.content.trim())) {
      setDraftCandidate(draft);
    }
  }, [draftKey, mode]);

  useEffect(() => {
    if (mode === 'edit') return;
    if (!title.trim() && !content.trim() && selectedTopics.length === 0) return;
    const timer = window.setTimeout(() => {
      writeDraft(draftKey, {
        version: 1,
        userId: String(user?._id || ''),
        title,
        content: toStoredContent(content),
        topicIds: selectedTopics.map((topic) => String(topic?._id || '')).filter(Boolean),
        topicNames: selectedTopics.map((topic) => String(topic?.name || '')).filter(Boolean),
        updatedAt: Date.now(),
      });
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [content, draftKey, mode, selectedTopics, title, user?._id]);

  useEffect(() => {
    const registry = imagesRef.current;
    return () => {
      for (const image of registry.values()) {
        URL.revokeObjectURL(image.url);
      }
      registry.clear();
    };
  }, []);

  useEffect(
    () =>
      subscribePublishQueue((event) => {
        if (event.type === 'edit_job') {
          void restoreFromJob(event.job);
        }
      }),
    // restoreFromJob 只依赖稳定的 setState/ref，不需要重复订阅
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    let active = true;
    const keyword = String(topicQuery || '').trim();
    if (!keyword) {
      setTopicSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setIsSuggestingTopic(true);
      const list = await getCommunityTopicSuggestions({
        q: keyword,
        limit: 8,
        appId: resolvedAppId || undefined,
      });
      if (!active) return;
      setTopicSuggestions(list);
      setIsSuggestingTopic(false);
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [resolvedAppId, topicQuery]);

  function toStoredContent(text: string) {
    let next = String(text || '');
    for (const image of imagesRef.current.values()) {
      if (image.url && next.includes(image.url)) {
        next = next.split(image.url).join(`local-image://${image.id}`);
      }
    }
    return next;
  }

  async function handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) {
      throw new Error('仅支持图片文件');
    }
    if (file.size > config.max_image_bytes) {
      throw new Error(`单张图片不能超过 ${Math.round(config.max_image_bytes / 1024 / 1024)}MB`);
    }
    if (imagesRef.current.size >= config.max_images) {
      throw new Error(`最多上传 ${config.max_images} 张图片`);
    }
    const id = createId('img');
    const url = URL.createObjectURL(file);
    imagesRef.current.set(id, {
      blob: file,
      id,
      name: file.name || 'image',
      size: file.size,
      type: file.type,
      url,
    });
    await putDraftImage(
      draftKey,
      { id, name: file.name || 'image', size: file.size, type: file.type },
      file,
    );
    return url;
  }

  async function restoreDraft(draft: CommunityDraft) {
    setIsReadingDraft(true);
    try {
      let restoredContent = draft.content;
      const storedImages = await readDraftImages(draftKey);
      for (const [id, record] of storedImages) {
        const url = URL.createObjectURL(record.blob);
        imagesRef.current.set(id, {
          blob: record.blob,
          id,
          name: record.meta.name,
          size: record.meta.size,
          type: record.meta.type,
          url,
        });
        restoredContent = restoredContent
          .split(`local-image://${id}`)
          .join(url);
      }
      setTitle(draft.title);
      setContent(restoredContent);
      setEditorMarkdown(restoredContent);
      setSelectedTopics(
        draft.topicIds.map((id, index) => ({
          _id: id,
          name: draft.topicNames[index] || id,
          slug: id,
        })) as CommunityTopicItem[],
      );
      setEditorOpen(true);
      setEditorKey((prev) => prev + 1);
      setDraftCandidate(null);
    } finally {
      setIsReadingDraft(false);
    }
  }

  async function discardDraft() {
    if (draftCandidate) {
      await clearDraft(draftKey);
    }
    setDraftCandidate(null);
  }

  async function restoreFromJob(job: CommunityPublishJob) {
    const restoredImages = new Map<string, LocalImage>();
    let restoredContent = job.content;
    for (const image of job.images) {
      const url = URL.createObjectURL(image.blob);
      restoredImages.set(image.id, { ...image, url });
      restoredContent = restoredContent
        .split(`local-image://${image.id}`)
        .join(url);
    }
    imagesRef.current = restoredImages;
    setTitle(job.title);
    setContent(restoredContent);
    setEditorMarkdown(restoredContent);
    setSelectedTopics(
      job.topicIds.map((id, index) => ({
        _id: id,
        name: job.topicNames[index] || id,
        slug: id,
      })) as CommunityTopicItem[],
    );
    setEditorOpen(true);
    setEditorKey((prev) => prev + 1);
    await deletePublishJob(job.id);
    toast({ title: '已恢复到编辑器', description: '请修改后重新发布。' });
  }

  function resetComposer() {
    for (const image of imagesRef.current.values()) {
      URL.revokeObjectURL(image.url);
    }
    imagesRef.current.clear();
    setTitle('');
    setContent('');
    setEditorMarkdown('');
    setSelectedTopics([]);
    setTopicQuery('');
    setEditorOpen(false);
    setEditorKey((prev) => prev + 1);
  }

  function handlePickTopic(topic: CommunityTopicItem) {
    setSelectedTopics((prev) => upsertTopic(prev, topic));
    setTopicQuery('');
    setTopicSuggestions([]);
  }

  function handleRemoveTopic(topicId: string) {
    const id = String(topicId || '').trim();
    if (!id) return;
    setSelectedTopics((prev) => prev.filter((item) => String(item._id) !== id));
  }

  async function handleQuickCreateTopic() {
    const keyword = String(topicQuery || '').trim();
    if (!keyword) {
      toast({ title: '请先输入话题关键字', variant: 'destructive' });
      return;
    }
    if (!isAuthenticated || !token) {
      setAuthOpen(true);
      return;
    }
    setIsCreatingTopic(true);
    const result = await quickCreateCommunityTopic({
      token,
      name: keyword.slice(0, MAX_TOPIC_NAME_LENGTH),
      appId: resolvedAppId || undefined,
    });
    setIsCreatingTopic(false);
    if (!result.ok || !result.topic) {
      toast({ title: '创建失败', description: result.message, variant: 'destructive' });
      return;
    }
    handlePickTopic(result.topic);
    toast({
      title: result.created ? '话题创建成功' : '已使用现有话题',
      description: `#${result.topic.name}`,
    });
  }

  async function submitEdit() {
    const trimmedContent = String(content || '').trim();
    if (!trimmedContent || !token || !onSubmitPost) {
      toast({ title: '帖子内容不能为空', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      let finalContent = trimmedContent;
      for (const image of imagesRef.current.values()) {
        const marker = `local-image://${image.id}`;
        if (!finalContent.includes(marker) && !finalContent.includes(image.url)) continue;
        const url = await uploadCommunityPostImage(token, image);
        finalContent = finalContent
          .split(marker)
          .join(url)
          .split(image.url)
          .join(url);
      }
      const hashtagNames = Array.from(
        new Set([
          ...extractHashtagNames(finalContent),
          ...selectedTopics.map((topic) => String(topic?.name || '').trim()).filter(Boolean),
        ]),
      );
      const result = await onSubmitPost({
        title: String(title || '').trim() || undefined,
        content: finalContent,
        topicIds: selectedTopics.map((topic) => String(topic?._id || '').trim()).filter(Boolean),
        topicNames: hashtagNames,
        source: 'web',
        appId: resolvedAppId || undefined,
      });
      if (!result.ok) {
        toast({ title: '保存失败', description: result.message, variant: 'destructive' });
        return;
      }
      await clearDraft(draftKey);
      onPosted?.();
    } catch (error) {
      toast({
        title: '保存失败',
        description: String((error as Error)?.message || '请稍后重试'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitPost() {
    if (isSubmitting) return;
    if (mode === 'edit') {
      await submitEdit();
      return;
    }
    const trimmedContent = String(content || '').trim();
    if (!trimmedContent) {
      toast({ title: '帖子内容不能为空', variant: 'destructive' });
      return;
    }
    if (!isAuthenticated || !token || !user?._id) {
      setAuthOpen(true);
      return;
    }
    if (trimmedContent.length > config.max_content_chars) {
      toast({
        title: '正文过长',
        description: `最多 ${config.max_content_chars} 个字符`,
        variant: 'destructive',
      });
      return;
    }
    if (imageCount > config.max_images) {
      toast({
        title: '图片过多',
        description: `最多 ${config.max_images} 张图片`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const storedContent = toStoredContent(trimmedContent);
      const hashtagNames = Array.from(
        new Set([
          ...extractHashtagNames(trimmedContent),
          ...selectedTopics.map((topic) => String(topic?.name || '').trim()).filter(Boolean),
        ]),
      );
      const images: CommunityPublishImage[] = Array.from(imagesRef.current.values())
        .filter((image) => storedContent.includes(`local-image://${image.id}`))
        .map((image) => ({
          blob: image.blob,
          id: image.id,
          name: image.name,
          size: image.size,
          type: image.type,
        }));
      const job: CommunityPublishJob = {
        id: createId('post'),
        userId: String(user._id),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'pending',
        attempts: 0,
        title: String(title || '').trim(),
        content: storedContent,
        topicIds: selectedTopics.map((topic) => String(topic?._id || '').trim()).filter(Boolean),
        topicNames: hashtagNames,
        appId: resolvedAppId || undefined,
        source: 'web',
        images,
      };
      await savePublishJob(job);
      await clearDraft(draftKey);
      setDraftCandidate(null);
      resetComposer();
      void processPublishQueue(String(user._id), token);
      toast({
        title: config.auto_publish ? '发布成功' : '已提交审核',
        description: '图片会在后台上传，无需停留本页。',
      });
    } catch (error) {
      toast({
        title: '发布失败',
        description: String((error as Error)?.message || '请稍后重试'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitText = isSubmitting
    ? submittingLabel || (mode === 'edit' ? '保存中...' : '发布中...')
    : submitLabel || (mode === 'edit' ? '保存修改' : '发布');

  const contentNode = (
    <>
      {draftCandidate ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            发现 {formatDraftTime(draftCandidate.updatedAt)} 的本地草稿
          </span>
          <span className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              disabled={isReadingDraft}
              onClick={() => void discardDraft()}
            >
              丢弃
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={isReadingDraft}
              onClick={() => void restoreDraft(draftCandidate)}
            >
              {isReadingDraft ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              恢复
            </Button>
          </span>
        </div>
      ) : null}

      <div className={surface === 'card' ? 'space-y-3 p-4' : 'space-y-3'}>
        <div className="flex items-start space-x-3">
          <Avatar className="mt-1">
            <AvatarImage
              src={user?.avatar || '/favicon.ico'}
              alt={user?.name || user?.username || '当前用户'}
              data-ai-hint="user avatar current"
            />
            <AvatarFallback>
              {(user?.name || user?.username || '我').slice(0, 1)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-grow">
            <Input
              type="text"
              placeholder="标题（可选）"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mb-2 h-auto rounded-none border-0 border-b px-1 py-1.5 shadow-none focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
            />

            {!editorOpen ? (
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="w-full rounded-md border border-input bg-background px-3 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                分享你的游戏体验，支持 Markdown、粘贴或拖拽图片
              </button>
            ) : (
              <CommunityEditor
                key={editorKey}
                markdown={editorMarkdown}
                onChange={(value) => setContent(value)}
                onImageFile={handleImageFile}
                onError={(message) =>
                  toast({ title: '图片处理失败', description: message, variant: 'destructive' })
                }
                disabled={isSubmitting}
              />
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ImagePlus className="h-3.5 w-3.5" />
                粘贴/拖拽图片，单张 ≤{Math.round(config.max_image_bytes / 1024 / 1024)}MB，最多 {config.max_images} 张
              </span>
              <span className={cn(imageCount > config.max_images && 'text-destructive')}>
                {imageCount}/{config.max_images} 张
              </span>
              <span className={cn(content.length > config.max_content_chars && 'text-destructive')}>
                {content.length}/{config.max_content_chars} 字
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {selectedTopics.map((topic) => (
                <Badge key={topic._id} variant="secondary" className="gap-1 pr-1 text-xs">
                  #{topic.name}
                  <button
                    type="button"
                    className="rounded p-0.5 hover:bg-black/10"
                    onClick={() => handleRemoveTopic(topic._id)}
                    aria-label="移除话题"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="relative flex items-center gap-1">
                <HashIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={topicQuery}
                  onChange={(event) => setTopicQuery(event.target.value)}
                  placeholder="搜索或创建话题"
                  className="h-7 w-40 px-1 text-xs"
                />
                {isSuggestingTopic ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : null}
              </div>
            </div>

            {topicQuery.trim() ? (
              <div className="mt-2 rounded-md border bg-background p-2 shadow-sm">
                {topicSuggestions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {topicSuggestions.map((topic) => (
                      <Button
                        key={topic._id}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => handlePickTopic(topic)}
                      >
                        #{topic.name}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>暂无匹配话题</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      disabled={isCreatingTopic}
                      onClick={() => void handleQuickCreateTopic()}
                    >
                      {isCreatingTopic ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <PlusCircle className="mr-1 h-3.5 w-3.5" />
                      )}
                      快捷创建
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex items-center justify-between gap-3',
          surface === 'card' ? 'px-4 pb-3 pt-0' : 'border-t pt-3',
        )}
      >
        <div className="flex items-center text-xs text-muted-foreground">
          {config.auto_publish ? (
            <span>发布后立即公开</span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              发布后进入审核，通过后公开
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-8"
            >
              取消
            </Button>
          ) : null}
          <Button
            size="sm"
            onClick={() => void handleSubmitPost()}
            disabled={!content.trim() || isSubmitting}
            className="btn-interactive h-8"
          >
            {isSubmitting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            {submitText}
          </Button>
        </div>
      </div>

      {authOpen ? <AuthModal open={authOpen} onOpenChange={setAuthOpen} /> : null}
    </>
  );

  if (surface === 'plain') {
    return <div className="space-y-3">{contentNode}</div>;
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">{contentNode}</CardContent>
    </Card>
  );
}
