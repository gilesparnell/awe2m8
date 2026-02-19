/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTaskModal } from '@/components/CreateTaskModal';

describe('CreateTaskModal', () => {
  const mockOnClose = jest.fn();
  const mockOnCreate = jest.fn();

  const defaultAgents = [
    { id: 'fury', name: 'Fury', color: 'green' as const },
    { id: 'friday', name: 'Friday', color: 'blue' as const },
    { id: 'loki', name: 'Loki', color: 'amber' as const },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnCreate.mockResolvedValue(undefined);
  });

  it('should not render when isOpen is false', () => {
    render(
      <CreateTaskModal
        isOpen={false}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={defaultAgents}
        creating={false}
      />
    );

    expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={defaultAgents}
        creating={false}
      />
    );

    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    expect(screen.getByText('Assign work to your AI squad')).toBeInTheDocument();
  });

  it('should render all form fields', () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={defaultAgents}
        creating={false}
      />
    );

    expect(screen.getByPlaceholderText('e.g., Research competitor pricing')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What needs to be done...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Sunset Plumbing')).toBeInTheDocument();
    expect(screen.getByText('Fury')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();
    expect(screen.getByText('Loki')).toBeInTheDocument();
  });

  it('should select first agent by default', () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={defaultAgents}
        creating={false}
      />
    );

    // First agent (Fury) should be selected by default
    const furyButton = screen.getByText('Fury');
    expect(furyButton).toHaveClass('border-green-700');
  });

  it('should allow changing agent selection', async () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={defaultAgents}
        creating={false}
      />
    );

    const fridayButton = screen.getByText('Friday');
    fireEvent.click(fridayButton);

    expect(fridayButton).toHaveClass('border-blue-700');
  });

  it('should have P2 priority selected by default', () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={defaultAgents}
        creating={false}
      />
    );

    const p2Button = screen.getByText('P2');
    expect(p2Button).toHaveClass('border-blue-500/50');
  });

  it('should allow changing priority', () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={defaultAgents}
        creating={false}
      />
    );

    const p0Button = screen.getByText('P0');
    fireEvent.click(p0Button);

    expect(p0Button).toHaveClass('border-red-500/50');
  });

  it('should have default estimated hours of 2', () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={defaultAgents}
        creating={false}
      />
    );

    const hoursInput = screen.getByDisplayValue('2');
    expect(hoursInput).toBeInTheDocument();
  });

  it('should call onCreate with form data when submitted', async () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={defaultAgents}
        creating={false}
      />
    );

    // Fill in the form
    await userEvent.type(
      screen.getByPlaceholderText('e.g., Research competitor pricing'),
      'Test Task Title'
    );
    await userEvent.type(
      screen.getByPlaceholderText('What needs to be done...'),
      'Test Description'
    );
    await userEvent.type(
      screen.getByPlaceholderText('e.g., Sunset Plumbing'),
      'Test Client'
    );

    // Select Friday
    fireEvent.click(screen.getByText('Friday'));

    // Select P1 priority
    fireEvent.click(screen.getByText('P1'));

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith({
        title: 'Test Task Title',
        description: 'Test Description',
        agentId: 'friday',
        priority: 'P1',
        estimatedHours: 2,
        clientName: 'Test Client',
      });
    });
  });

  it('should disable submit button when title is empty', () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={defaultAgents}
        creating={false}
      />
    );

    const submitButton = screen.getByRole('button', { name: /create task/i });
    expect(submitButton).toBeDisabled();
  });

  it('should disable submit button when creating', () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={defaultAgents}
        creating={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /creating task/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Creating Task...')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={defaultAgents}
        creating={false}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should reset form after successful creation', async () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={defaultAgents}
        creating={false}
      />
    );

    // Fill and submit
    await userEvent.type(
      screen.getByPlaceholderText('e.g., Research competitor pricing'),
      'Test Task'
    );
    
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle empty agents array gracefully', () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        agents={[]}
        creating={false}
      />
    );

    // Should still render without crashing
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
  });
});
