
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText } from 'lucide-react'; // Using ScrollText for rules icon

export default function CommunityInfoPanel() {
  return (
    <Card className="sticky top-20 shadow-sm"> {/* top-20 to account for header height */}
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-base font-semibold flex items-center">
          <ScrollText size={18} className="mr-2 text-primary" />
          游戏综合区发帖/讨论规范
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 text-xs text-muted-foreground space-y-2">
        <p>深井是一款提供海量游戏先锋资讯、专业游戏攻略、定制游戏百科/工具、玩家社区一站式游戏服务应用。</p>
        <p>深井隐私政策及儿童个人信息保护规则</p>
        <p>联系我们: <a href="mailto:deepwellgame@163.com" className="text-primary hover:underline">deepwellgame@163.com</a></p>
        <p>网易公司版权所有 ©1997-2024</p>
        <p>浙ICP备15005366号-3</p>
        <p>推荐: UU加速器 UU远程 章鱼云手机</p>
        <p>涉企侵权举报专区: <a href="#" className="text-primary hover:underline">点击举报</a></p>
      </CardContent>
    </Card>
  );
}
