'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  ImageIcon,
  VideoIcon,
  SmileIcon,
  AtSignIcon,
  HashIcon,
  UsersIcon,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const postTools = [
  { name: '表情', icon: SmileIcon, action: () => console.log('Open emoji picker') },
  { name: '图片', icon: ImageIcon, action: () => console.log('Upload image') },
  { name: '视频', icon: VideoIcon, action: () => console.log('Upload video') },
  { name: '提及', icon: AtSignIcon, action: () => console.log('Mention user') },
  { name: '话题', icon: HashIcon, action: () => console.log('Add hashtag') },
  { name: '组队', icon: UsersIcon, action: () => console.log('Squad up') },
];

const mockCategories = ['游戏综合区', '绝地求生', 'Apex Legends', '王者荣耀', '原神'];

export default function CreatePostForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(mockCategories[0]);

  const handlePost = () => {
    console.log('Posting:', { title, content, category: selectedCategory });
    alert(`模拟发帖：\n标题: ${title || '无'}\n内容: ${content}\n板块: ${selectedCategory}`);
    setTitle('');
    setContent('');
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="mt-1">
            <AvatarImage
              src="https://placehold.co/40x40.png?text=ME"
              alt="我的头像"
              data-ai-hint="user avatar current"
            />
            <AvatarFallback>我</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <Input
              type="text"
              placeholder="标题（可选）"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-2 h-auto rounded-none border-0 border-b px-1 py-1.5 shadow-none focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Textarea
              placeholder="分享你的游戏体验..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="resize-none border-0 px-1 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between px-4 pb-3 pt-0">
        <div className="flex items-center gap-1">
          {postTools.map((tool) => (
            <Button
              key={tool.name}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={tool.action}
              aria-label={tool.name}
              title={tool.name}
            >
              <tool.icon size={18} />
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {selectedCategory} <ChevronDown size={16} className="ml-1 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {mockCategories.map((cat) => (
                <DropdownMenuItem key={cat} onSelect={() => setSelectedCategory(cat)} className="text-xs">
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={handlePost} disabled={!content.trim()} className="btn-interactive h-8">
            发布
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
