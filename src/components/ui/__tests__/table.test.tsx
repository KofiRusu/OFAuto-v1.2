import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from '../table';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

describe('Table Component', () => {
  const mockOnRowClick = jest.fn();
  
  const TestTable = () => (
    <Table caption="Test Table">
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow onClick={mockOnRowClick} data-testid="row-1">
          <TableCell>1</TableCell>
          <TableCell>John Doe</TableCell>
          <TableCell>john@example.com</TableCell>
        </TableRow>
        <TableRow data-testid="row-2">
          <TableCell>2</TableCell>
          <TableCell>Jane Smith</TableCell>
          <TableCell>jane@example.com</TableCell>
        </TableRow>
        <TableRow isSelected data-testid="row-3">
          <TableCell>3</TableCell>
          <TableCell>Bob Johnson</TableCell>
          <TableCell>bob@example.com</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
  
  beforeEach(() => {
    mockOnRowClick.mockClear();
  });
  
  it('should render correctly', () => {
    render(<TestTable />);
    
    // Check headers
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    
    // Check cells
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    
    // Check caption
    expect(screen.getByText('Test Table')).toBeInTheDocument();
  });
  
  it('should apply selected state styling', () => {
    render(<TestTable />);
    
    const selectedRow = screen.getByTestId('row-3');
    expect(selectedRow).toHaveAttribute('aria-selected', 'true');
    expect(selectedRow).toHaveAttribute('data-state', 'selected');
  });
  
  it('should call onClick handler when clicked', () => {
    render(<TestTable />);
    
    const clickableRow = screen.getByTestId('row-1');
    fireEvent.click(clickableRow);
    
    expect(mockOnRowClick).toHaveBeenCalledTimes(1);
  });
  
  it('should render with caption on top when specified', () => {
    render(
      <Table caption="Top Caption" captionSide="top">
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    const caption = screen.getByText('Top Caption');
    expect(caption).toHaveClass('caption-top');
  });
  
  it('should allow keyboard navigation for focusable rows', () => {
    render(
      <Table>
        <TableBody>
          <TableRow isFocusable data-testid="focusable-row">
            <TableCell>Focusable Row</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    const focusableRow = screen.getByTestId('focusable-row');
    expect(focusableRow).toHaveAttribute('tabIndex', '0');
  });
  
  it('should have no accessibility violations', async () => {
    const { container } = render(<TestTable />);
    
    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
}); 