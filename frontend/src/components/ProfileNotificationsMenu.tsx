import { useNotifications } from "@/hooks/useNotifications";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileNotificationsMenuProps {
  onOpenNotifications: () => void;
}

export function ProfileNotificationsMenu({ onOpenNotifications }: ProfileNotificationsMenuProps) {
  const { unreadCount } = useNotifications();

  return (
    <DropdownMenuItem
      onSelect={onOpenNotifications}
      className="cursor-pointer flex items-center justify-between gap-2"
    >
      <span className="flex items-center gap-2">
        <Bell className="w-4 h-4" />
        Notifications
      </span>
      {unreadCount > 0 && (
        <Badge variant="destructive" className="ml-auto">
          {unreadCount}
        </Badge>
      )}
    </DropdownMenuItem>
  );
}
