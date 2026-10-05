import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GitRepoSubmissionForm from '../GitRepoSubmissionForm';
import { GitAuthProvider } from '../../../contexts/GitAuthContext';

describe('GitRepoSubmissionForm', () => {
  const renderForm = () => {
    return render(
      <GitAuthProvider>
        <GitRepoSubmissionForm />
      </GitAuthProvider>
    );
  };

  it('renders correctly with default state', () => {
    renderForm();
    expect(screen.getByText('Submit Repository for Analysis')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://github.com/owner/repo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('main')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /private repository/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('shows error when submitting empty fields', () => {
    renderForm();
    const submitBtn = screen.getByText('Start Analysis');
    
    // Attempt submit with empty fields
    fireEvent.click(submitBtn);
    
    expect(screen.getByText('GitHub URL is required.')).toBeInTheDocument();
  });

  it('shows error when submitting invalid GitHub URL', () => {
    renderForm();
    const urlInput = screen.getByPlaceholderText('https://github.com/owner/repo');
    const submitBtn = screen.getByText('Start Analysis');
    
    fireEvent.change(urlInput, { target: { value: 'https://gitlab.com/test' } });
    fireEvent.click(submitBtn);
    
    expect(screen.getByText('Invalid GitHub URL. Must be formatted as https://github.com/owner/repo')).toBeInTheDocument();
  });

  it('opens PAT Modal when toggled to Private', () => {
    renderForm();
    const toggleBtn = screen.getByRole('switch', { name: /private repository/i });
    
    fireEvent.click(toggleBtn);
    
    expect(toggleBtn).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Private Repository Access')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ghp_...')).toBeInTheDocument();
  });
});
