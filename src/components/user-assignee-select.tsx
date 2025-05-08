"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, User as UserIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { User, UserAvatar } from "./user-avatar";

// TODO: Replace with actual API call to get users from your backend
// This is just a mock implementation for scaffolding
const getAssignableUsers = async (): Promise<User[]> => {
  // Mock data - should be replaced with actual API call
  return [
    { id: "1", name: "John Doe", email: "john@example.com", avatar: "/avatars/01.png" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", avatar: "/avatars/02.png" },
    { id: "3", name: "Alex Johnson", email: "alex@example.com", avatar: "/avatars/03.png" },
    { id: "4", name: "Sam Williams", email: "sam@example.com", avatar: "/avatars/04.png" },
  ];
};

interface UserAssigneeSelectProps {
  selectedUserId: string | undefined;
  onUserSelect: (userId: string | undefined) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function UserAssigneeSelect({
  selectedUserId,
  onUserSelect,
  label = "Assignee",
  placeholder = "Select assignee...",
  required = false,
  disabled = false,
  className,
}: UserAssigneeSelectProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const fetchedUsers = await getAssignableUsers();
        setUsers(fetchedUsers);
        
        if (selectedUserId) {
          const user = fetchedUsers.find(u => u.id === selectedUserId);
          setSelectedUser(user);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [selectedUserId]);

  const handleSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user);
    onUserSelect(userId);
    setOpen(false);
  };

  const clearSelection = () => {
    setSelectedUser(undefined);
    onUserSelect(undefined);
    setOpen(false);
  };

  return (
    <div className={className}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
          {label}{required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
          >
            {selectedUser ? (
              <div className="flex items-center">
                <UserAvatar user={selectedUser} size="sm" className="mr-2" />
                <span>{selectedUser.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandEmpty>
              {loading ? "Loading..." : "No users found."}
            </CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={() => handleSelect(user.id)}
                >
                  <UserAvatar user={user} size="sm" className="mr-2" />
                  <span>{user.name}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            {selectedUser && (
              <div className="p-1 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-destructive"
                  onClick={clearSelection}
                >
                  Clear selection
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 