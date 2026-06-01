'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  createCommunityPost,
  getCommunityTopicSuggestions,
  quickCreateCommunityTopic,
  type CommunityTopicItem,
} from '@/lib/community-api';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { HashIcon, Loader2, PlusCircle, Send, X } from 'lucide-react';

interface CreatePostFormProps {
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

const MAX_TOPIC_NAME_LENGTH = 24;

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

function detectCurrentHashtag(text: string, cursor: number): string {
  const safeCursor = Math.max(0, Math.min(cursor, text.length));
  const before = text.slice(0, safeCursor);
  const match = before.match(/(?:^|\s)#([^\s#]{0,24})$/);
  return String(match?.[1] || '').trim();
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

function normalizeTopicList(input: CommunityTopicItem[] | undefined): CommunityTopicItem[] {
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

export default function CreatePostForm({
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

  const [title, setTitle] = useState(() => String(initialTitle || ''));
  const [content, setContent] = useState(() => String(initialContent || ''));
  const [cursor, setCursor] = useState(() => String(initialContent || '').length);

  const [selectedTopics, setSelectedTopics] = useState<CommunityTopicItem[]>(
    () => normalizeTopicList(initialTopics),
  );
  const [topicSuggestions, setTopicSuggestions] = useState<CommunityTopicItem[]>([]);
  const [isSuggestingTopic, setIsSuggestingTopic] = useState(false);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hashtagKeyword = useMemo(() => detectCurrentHashtag(content, cursor), [content, cursor]);
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

  const setTextareaCursor = (nextCursor: number) => {
    const safeCursor = Math.max(0, nextCursor);
    setCursor(safeCursor);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(safeCursor, safeCursor);
    });
  };

  useEffect(() => {
    if (!selectedTopic?._id) return;
    setSelectedTopics((prev) => upsertTopic(prev, selectedTopic));
  }, [selectedTopic]);

  useEffect(() => {
    if (!shouldAutoFocus) return;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const end = textareaRef.current?.value.length || 0;
      textareaRef.current?.setSelectionRange(end, end);
      onAutoFocusHandled?.();
    });
  }, [onAutoFocusHandled, shouldAutoFocus]);

  useEffect(() => {
    let active = true;
    const keyword = String(hashtagKeyword || '').trim();
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
  }, [hashtagKeyword, resolvedAppId]);

  function handlePickTopic(topic: CommunityTopicItem) {
    const topicName = String(topic?.name || '').trim();
    if (!topicName) return;

    setSelectedTopics((prev) => upsertTopic(prev, topic));

    const safeCursor = Math.max(0, Math.min(cursor, content.length));
    const before = content.slice(0, safeCursor);
    const after = content.slice(safeCursor);
    const hashIndex = before.lastIndexOf('#');

    if (hashIndex >= 0) {
      const nextValue = `${before.slice(0, hashIndex + 1)}${topicName} ${after}`;
      setContent(nextValue);
      setTextareaCursor(hashIndex + topicName.length + 2);
      return;
    }

    const suffix = content.endsWith(' ') || content.length === 0 ? '' : ' ';
    const nextValue = `${content}${suffix}#${topicName} `;
    setContent(nextValue);
    setTextareaCursor(nextValue.length);
  }

  function handleRemoveTopic(topicId: string) {
    const id = String(topicId || '').trim();
    if (!id) return;
    setSelectedTopics((prev) => prev.filter((item) => String(item._id) !== id));
  }

  async function handleQuickCreateTopic() {
    const keyword = String(hashtagKeyword || '').trim();
    if (!keyword) {
      toast({ title: '请先输入话题关键字', variant: 'destructive' });
      return;
    }

    if (!isAuthenticated || !token) {
      toast({ title: '需要登录', description: '请先登录后再创建话题', variant: 'destructive' });
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

  async function handleSubmitPost() {
    if (isSubmitting) return;

    const trimmedContent = String(content || '').trim();
    if (!trimmedContent) {
      toast({ title: '帖子内容不能为空', variant: 'destructive' });
      return;
    }

    if (!isAuthenticated || !token) {
      toast({ title: '需要登录', description: '请先登录后再发布帖子', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const hashtagNames = Array.from(
      new Set([
        ...extractHashtagNames(trimmedContent),
        ...selectedTopics
          .map((topic) => String(topic?.name || '').trim())
          .filter(Boolean),
      ]),
    );

    const submitPost = onSubmitPost
      ? onSubmitPost
      : async (payload: {
          appId?: string;
          content: string;
          source: string;
          title?: string;
          topicIds?: string[];
          topicNames?: string[];
        }) =>
          await createCommunityPost({
            token,
            ...payload,
          });
    const result = await submitPost({
      title: String(title || '').trim() || undefined,
      content: trimmedContent,
      topicIds: selectedTopics
        .map((topic) => String(topic?._id || '').trim())
        .filter(Boolean),
      topicNames: hashtagNames,
      source: 'web',
      appId: resolvedAppId || undefined,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      toast({
        title: mode === 'edit' ? '保存失败' : '发布失败',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    if (mode === 'create') {
      setTitle('');
      setContent('');
      setTopicSuggestions([]);
      setSelectedTopics(selectedTopic?._id ? [selectedTopic] : []);
    }

    toast({
      title: mode === 'edit' ? '保存成功' : '发布成功',
      description: result.message || (mode === 'edit' ? '帖子已更新' : '帖子已提交'),
    });
    onPosted?.();
  }

  const suggestionVisible = hashtagKeyword.length > 0;
  const submitText = isSubmitting
    ? submittingLabel || (mode === 'edit' ? '保存中...' : '发布中...')
    : submitLabel || (mode === 'edit' ? '保存修改' : '发布');

  const contentNode = (
    <>
      <div className={surface === 'card' ? 'space-y-3 p-4' : 'space-y-3'}>
        <div className="flex items-start space-x-3">
          <Avatar className="mt-1">
            <AvatarImage
              src={user?.avatar || '/favicon.ico'}
              alt={user?.name || user?.username || '当前用户'}
              data-ai-hint="user avatar current"
            />
            <AvatarFallback>{(user?.name || user?.username || '我').slice(0, 1)}</AvatarFallback>
          </Avatar>

          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="标题（可选）"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mb-2 h-auto rounded-none border-0 border-b px-1 py-1.5 shadow-none focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
            />

            <Textarea
              ref={textareaRef}
              placeholder="分享你的游戏体验，输入 # 可关联话题"
              value={content}
              rows={4}
              onChange={(event) => {
                setContent(event.target.value);
                setCursor(event.target.selectionStart || event.target.value.length);
              }}
              onClick={(event) => setCursor(event.currentTarget.selectionStart || 0)}
              onKeyUp={(event) => setCursor(event.currentTarget.selectionStart || 0)}
              className="resize-none border-0 px-1 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />

            {selectedTopics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
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
              </div>
            )}

            {suggestionVisible && (
              <div className="mt-2 rounded-md border bg-background p-2 shadow-sm">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>话题联想：#{hashtagKeyword}</span>
                  {isSuggestingTopic ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                </div>

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
                      onClick={handleQuickCreateTopic}
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
            )}
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
          <HashIcon className="mr-1 h-3.5 w-3.5" />
          输入 # 即可搜索和关联话题
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
            onClick={handleSubmitPost}
            disabled={!content.trim() || isSubmitting}
            className="btn-interactive h-8"
          >
            {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
            {submitText}
          </Button>
        </div>
      </div>
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
