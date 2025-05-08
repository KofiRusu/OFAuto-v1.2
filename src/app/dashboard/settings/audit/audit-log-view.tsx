"use client";

import { useState } from "react";
import { 
  AuditAction, 
  UserRole
} from "@prisma/client";
import { formatDate, formatDistanceToNow } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  RefreshCw, 
  Shield, 
  ShieldAlert,
  User as UserIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter
} from "lucide-react";
import { RoleIndicator } from "@/components/auth/role-indicator";

// Define the shape of our audit log from the database
type AuditLogUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

type AuditLog = {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: Date;
  performedById: string;
  performedBy: AuditLogUser;
  targetUserId: string | null;
  targetUser: AuditLogUser | null;
};

interface AuditLogViewProps {
  initialAuditLogs: AuditLog[];
}

export function AuditLogView({ initialAuditLogs }: AuditLogViewProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/audit/logs");
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      }
    } catch (error) {
      console.error("Error refreshing audit logs:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Filter logs based on selected filter and search query
  const filteredLogs = auditLogs.filter(log => {
    // Filter by action type
    if (filter !== "all" && log.action !== filter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.performedBy.email.toLowerCase().includes(query) ||
        (log.performedBy.name?.toLowerCase() || "").includes(query) ||
        (log.targetUser?.email.toLowerCase() || "").includes(query) ||
        (log.targetUser?.name?.toLowerCase() || "").includes(query) ||
        log.entityType.toLowerCase().includes(query) ||
        log.entityId.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Format action badge
  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case "ROLE_CHANGE":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <Shield className="h-3 w-3 mr-1" /> Role Change
          </Badge>
        );
      case "USER_CREATE":
        return (
          <Badge className="bg-green-100 text-green-800">
            <UserIcon className="h-3 w-3 mr-1" /> User Created
          </Badge>
        );
      case "USER_DELETE":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3 mr-1" /> User Deleted
          </Badge>
        );
      case "LOGIN":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" /> Login
          </Badge>
        );
      case "LOGOUT":
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" /> Logout
          </Badge>
        );
      case "SETTINGS_CHANGE":
        return (
          <Badge className="bg-amber-100 text-amber-800">
            <Shield className="h-3 w-3 mr-1" /> Settings Change
          </Badge>
        );
      default:
        return (
          <Badge>
            {action}
          </Badge>
        );
    }
  };
  
  // Extract and format details for role changes
  const formatDetails = (log: AuditLog) => {
    try {
      if (log.action === "ROLE_CHANGE") {
        const details = JSON.parse(log.details);
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">From:</span>
              <RoleIndicator role={details.oldRole as UserRole} size="sm" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">To:</span>
              <RoleIndicator role={details.newRole as UserRole} size="sm" />
            </div>
          </div>
        );
      }
      
      // For other action types, just return a simplified version
      return (
        <span className="text-xs text-muted-foreground">
          {JSON.stringify(JSON.parse(log.details), null, 2).substring(0, 50)}...
        </span>
      );
    } catch (e) {
      return <span className="text-xs text-muted-foreground">{log.details}</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              Security and role change events across the system
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="ROLE_CHANGE">Role Changes</SelectItem>
                <SelectItem value="USER_CREATE">User Creation</SelectItem>
                <SelectItem value="USER_DELETE">User Deletion</SelectItem>
                <SelectItem value="LOGIN">Logins</SelectItem>
                <SelectItem value="LOGOUT">Logouts</SelectItem>
                <SelectItem value="SETTINGS_CHANGE">Settings Changes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-2" />
                      <p>No audit logs found matching your criteria</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.performedBy.email}</span>
                        <div className="flex items-center gap-1">
                          <RoleIndicator role={log.performedBy.role} size="sm" showTooltip={false} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.targetUser ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{log.targetUser.email}</span>
                          <div className="flex items-center gap-1">
                            <RoleIndicator role={log.targetUser.role} size="sm" showTooltip={false} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDetails(log)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <time 
                          dateTime={log.createdAt.toISOString()}
                          className="text-xs text-muted-foreground"
                          title={formatDate(log.createdAt)}
                        >
                          {formatDistanceToNow(log.createdAt)} ago
                        </time>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="text-xs text-muted-foreground mt-2 text-right">
          Showing {filteredLogs.length} of {auditLogs.length} log entries
        </div>
      </CardContent>
    </Card>
  );
} 