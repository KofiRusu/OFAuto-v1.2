import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from './modal';
import { Button } from './button';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'aria-dialog-name',
            enabled: true
          },
          {
            id: 'focus-trap-dialog',
            enabled: true
          }
        ]
      }
    }
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['center', 'top', 'bottom']
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'xl', 'full']
    },
    open: {
      control: 'boolean'
    },
    hideCloseButton: {
      control: 'boolean'
    }
  },
  decorators: [
    (Story) => (
      <div className="h-[400px] flex items-center justify-center">
        {Story()}
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    open: true,
    onClose: () => {},
    children: (
      <>
        <ModalHeader>
          <ModalTitle>Modal Title</ModalTitle>
          <ModalDescription>This is a sample modal dialog.</ModalDescription>
        </ModalHeader>
        <div>
          <p>Modal content goes here. This is a fully accessible modal with a focus trap.</p>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => {}}>Cancel</Button>
          <Button onClick={() => {}}>Save</Button>
        </ModalFooter>
      </>
    ),
  },
};

export const SmallSize: Story = {
  args: {
    ...Default.args,
    size: 'sm',
  },
};

export const LargeSize: Story = {
  args: {
    ...Default.args,
    size: 'lg',
    children: (
      <>
        <ModalHeader>
          <ModalTitle>Large Modal</ModalTitle>
          <ModalDescription>This is a larger modal dialog.</ModalDescription>
        </ModalHeader>
        <div className="py-4">
          <p>This modal has more content to demonstrate a larger size variant.</p>
          <p className="mt-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar
            risus non risus hendrerit venenatis. Pellentesque sit amet hendrerit risus,
            sed porttitor quam.
          </p>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => {}}>Cancel</Button>
          <Button onClick={() => {}}>Save</Button>
        </ModalFooter>
      </>
    ),
  },
};

export const TopPosition: Story = {
  args: {
    ...Default.args,
    position: 'top',
  },
};

export const NoCloseButton: Story = {
  args: {
    ...Default.args,
    hideCloseButton: true,
  },
};

export const WithForm: Story = {
  args: {
    ...Default.args,
    children: (
      <>
        <ModalHeader>
          <ModalTitle>Login Form</ModalTitle>
          <ModalDescription>Enter your credentials to continue.</ModalDescription>
        </ModalHeader>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="rounded-md border p-2"
                placeholder="example@example.com"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="rounded-md border p-2"
              />
            </div>
          </div>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => {}}>
              Cancel
            </Button>
            <Button type="submit">Login</Button>
          </ModalFooter>
        </form>
      </>
    ),
  },
}; 