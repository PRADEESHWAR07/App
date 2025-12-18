import React from 'react';

export type PageType = 'project' | 'work' | 'paper' | 'daily_log';

export type BlockType = 'text' | 'h1' | 'h2' | 'todo' | 'bullet';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean; // Only for 'todo'
}

export interface Page {
  id: string;
  type: PageType;
  title: string;
  emoji: string;
  createdAt: number;
  updatedAt: number;
  blocks: Block[];
  progress: number; // 0 to 100, calculated or manual
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  type?: PageType;
}