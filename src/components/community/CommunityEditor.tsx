'use client';

import '@mdxeditor/editor/style.css';

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertImage,
  ListsToggle,
  MDXEditor,
  type MDXEditorMethods,
  Separator,
  UndoRedo,
  codeBlockPlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from '@mdxeditor/editor';
import { useRef, type ClipboardEvent, type DragEvent } from 'react';

export interface CommunityEditorProps {
  disabled?: boolean;
  markdown: string;
  onChange: (markdown: string) => void;
  onError?: (message: string) => void;
  onImageFile: (file: File) => Promise<string>;
}

function collectImageFiles(list: FileList | null | undefined) {
  if (!list) return [] as File[];
  return Array.from(list).filter((file) => file.type.startsWith('image/'));
}

export default function CommunityEditor({
  disabled = false,
  markdown,
  onChange,
  onError,
  onImageFile,
}: CommunityEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null);

  const insertImages = async (files: File[]) => {
    for (const file of files) {
      try {
        const url = await onImageFile(file);
        editorRef.current?.insertMarkdown(`\n\n![](${url})\n\n`);
      } catch (error) {
        onError?.(String((error as Error)?.message || '图片处理失败'));
      }
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const fromFiles = collectImageFiles(event.clipboardData?.files);
    const fromItems = Array.from(event.clipboardData?.items || [])
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    const files = [...fromFiles, ...fromItems];
    if (files.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    void insertImages(files);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    const files = collectImageFiles(event.dataTransfer?.files);
    if (files.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    void insertImages(files);
  };

  return (
    <div
      className="community-editor"
      onPasteCapture={handlePaste}
      onDrop={handleDrop}
      onDragOver={(event) => {
        if (
          Array.from(event.dataTransfer?.items || []).some(
            (item) => item.kind === 'file',
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <MDXEditor
        ref={editorRef}
        markdown={markdown}
        onChange={(value) => onChange(value)}
        readOnly={disabled}
        className="community-editor-inner"
        contentEditableClassName="community-editor-content"
        plugins={[
          headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4] }),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: '' }),
          imagePlugin({
            imageUploadHandler: onImageFile,
            disableImageResize: true,
            disableImageSettingsButton: true,
          }),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
                <ListsToggle />
                <CreateLink />
                <InsertImage />
              </>
            ),
          }),
        ]}
      />
    </div>
  );
}
