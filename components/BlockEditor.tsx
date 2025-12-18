import React, { useRef, useEffect } from 'react';
import { Block, BlockType } from '../types';
import { X, GripVertical, CheckSquare, Square, Type, Hash, List } from 'lucide-react';

interface BlockEditorProps {
  block: Block;
  onChange: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onEnter: (id: string) => void;
  autoFocus?: boolean;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ 
  block, 
  onChange, 
  onDelete, 
  onEnter,
  autoFocus 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [block.content]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter(block.id);
    }
    if (e.key === 'Backspace' && block.content === '') {
      e.preventDefault();
      onDelete(block.id);
    }
    // Command/Ctrl + / to cycle types (simple shortcut)
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
       e.preventDefault();
       const types: BlockType[] = ['text', 'todo', 'h1', 'h2', 'bullet'];
       const nextIndex = (types.indexOf(block.type) + 1) % types.length;
       onChange(block.id, { type: types[nextIndex] });
    }
  };

  const getStyles = () => {
    switch (block.type) {
      case 'h1': return 'text-3xl font-bold mt-6 mb-2 text-gray-900';
      case 'h2': return 'text-xl font-semibold mt-4 mb-2 text-gray-800 border-b border-gray-100 pb-1';
      case 'todo': return 'text-base text-gray-700';
      case 'bullet': return 'text-base text-gray-700';
      default: return 'text-base text-gray-600';
    }
  };

  return (
    <div className="group flex items-start -ml-8 pl-2 py-1 relative hover:bg-gray-50 rounded-sm transition-colors duration-200">
      {/* Drag/Option Handle (Visible on hover) */}
      <div className="absolute left-0 top-1.5 opacity-0 group-hover:opacity-40 hover:!opacity-100 cursor-grab flex items-center justify-center w-6 h-6 transition-opacity">
        <GripVertical size={14} />
      </div>

      {/* Block Type Indicator / Checkbox */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center pt-1 mr-2 select-none">
        {block.type === 'todo' ? (
          <button 
            onClick={() => onChange(block.id, { checked: !block.checked })}
            className="text-gray-400 hover:text-green-600 transition-colors"
          >
            {block.checked ? <CheckSquare size={18} className="text-green-600" /> : <Square size={18} />}
          </button>
        ) : block.type === 'bullet' ? (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-800 mt-2" />
        ) : block.type === 'h1' ? (
          <Hash size={16} className="text-gray-300" />
        ) : block.type === 'h2' ? (
           <Hash size={14} className="text-gray-300" />
        ) : (
          <span className="text-xs text-gray-300 opacity-0 group-hover:opacity-100">Tx</span>
        )}
      </div>

      {/* Content Editor */}
      <textarea
        ref={textareaRef}
        value={block.content}
        onChange={(e) => onChange(block.id, { content: e.target.value })}
        onKeyDown={handleKeyDown}
        placeholder={block.type === 'h1' ? "Heading 1" : block.type === 'todo' ? "To-do item" : "Type something..."}
        className={`w-full bg-transparent resize-none outline-none overflow-hidden ${getStyles()} ${block.checked ? 'line-through opacity-50' : ''}`}
        rows={1}
      />
    </div>
  );
};
