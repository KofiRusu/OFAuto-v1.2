import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '../modal';
import { Button } from '../button';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

describe('Modal Component', () => {
  const mockOnClose = jest.fn();
  
  const TestModal = ({ open = true }) => (
    <Modal open={open} onClose={mockOnClose}>
      <ModalHeader>
        <ModalTitle>Test Modal</ModalTitle>
        <ModalDescription>This is a test modal description</ModalDescription>
      </ModalHeader>
      <div className="py-4">
        <p>Modal content for testing</p>
      </div>
      <ModalFooter>
        <Button variant="outline" onClick={mockOnClose}>Cancel</Button>
        <Button>Submit</Button>
      </ModalFooter>
    </Modal>
  );
  
  beforeEach(() => {
    mockOnClose.mockClear();
  });
  
  it('should render correctly when open', () => {
    render(<TestModal open={true} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('This is a test modal description')).toBeInTheDocument();
    expect(screen.getByText('Modal content for testing')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });
  
  it('should not render when closed', () => {
    render(<TestModal open={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });
  
  it('should call onClose when the close button is clicked', () => {
    render(<TestModal open={true} />);
    
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('should call onClose when the backdrop is clicked', () => {
    render(<TestModal open={true} />);
    
    // Find the backdrop element (it has aria-hidden="true")
    const backdrop = screen.getByRole('dialog').nextSibling as HTMLElement;
    fireEvent.click(backdrop);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('should call onClose when Escape key is pressed', () => {
    render(<TestModal open={true} />);
    
    // Simulate pressing the Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('should render without close button when hideCloseButton is true', () => {
    render(
      <Modal open={true} onClose={mockOnClose} hideCloseButton>
        <ModalHeader>
          <ModalTitle>Test Modal</ModalTitle>
        </ModalHeader>
        <div>Content</div>
      </Modal>
    );
    
    expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
  });
  
  it('should have no accessibility violations', async () => {
    const { container } = render(<TestModal open={true} />);
    
    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
}); 