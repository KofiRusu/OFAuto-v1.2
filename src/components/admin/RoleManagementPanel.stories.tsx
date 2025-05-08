import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { RoleManagementPanel } from './RoleManagementPanel';

const meta: Meta<typeof RoleManagementPanel> = {
  title: 'Admin/RoleManagementPanel',
  component: RoleManagementPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    a11y: {
      config: {
        rules: [
          {
            id: 'aria-required-attr',
            enabled: true
          },
          {
            id: 'button-name',
            enabled: true
          },
          {
            id: 'color-contrast',
            enabled: true
          }
        ]
      }
    }
  },
  argTypes: {
    onUserUpdate: { action: 'userUpdated' },
    onRoleUpdate: { action: 'roleUpdated' }
  }
};

export default meta;
type Story = StoryObj<typeof RoleManagementPanel>;

export const Default: Story = {};

// Custom mock data for different stories
const customUsers = [
  { id: 1, name: 'Alex Morgan', email: 'alex@ofauto.com', role: 'admin', status: 'active' },
  { id: 2, name: 'Sophia Chen', email: 'sophia@ofauto.com', role: 'manager', status: 'active' },
  { id: 3, name: 'Marcus Johnson', email: 'marcus@ofauto.com', role: 'creator', status: 'inactive' },
];

const customRoles = [
  {
    id: 'admin',
    name: 'Super Admin',
    description: 'Complete system control',
    color: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    permissions: [
      'manage_users',
      'manage_roles',
      'view_analytics',
      'edit_content',
      'delete_content',
      'manage_settings',
      'view_reports',
      'manage_teams',
    ],
  },
  {
    id: 'moderator',
    name: 'Content Moderator',
    description: 'Reviews and approves content',
    color: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    permissions: [
      'view_analytics',
      'edit_content',
      'delete_content',
    ],
  },
  {
    id: 'creator',
    name: 'Content Creator',
    description: 'Creates and manages content',
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    permissions: [
      'edit_content',
    ],
  },
];

export const CustomData: Story = {
  args: {
    initialUsers: customUsers,
    initialRoles: customRoles
  }
};

export const EmptyUsers: Story = {
  args: {
    initialUsers: []
  }
};

export const ManyUsers: Story = {
  args: {
    initialUsers: Array(20).fill(null).map((_, idx) => ({
      id: idx + 1,
      name: `User ${idx + 1}`,
      email: `user${idx + 1}@example.com`,
      role: ['admin', 'manager', 'creator', 'viewer'][idx % 4],
      status: idx % 3 === 0 ? 'inactive' : 'active'
    }))
  }
}; 