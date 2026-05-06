// src/components/Editor.tsx
import { BlockEditorProvider, BlockList, WritingFlow, ObserveTyping } from '@wordpress/block-editor';
import { useState } from 'react';
import { registerCoreBlocks } from '@wordpress/block-library';
import { SlotFillProvider } from '@wordpress/components'; // SlotFillProvider 추가

registerCoreBlocks(); // 모든 기본 블록 등록

export const GutenbergEditor = ({ initialBlocks }) => {
  const [blocks, updateBlocks] = useState(initialBlocks);
  
  return (
    <SlotFillProvider> {/* SlotFillProvider로 감싸야 플러그인 확장 가능 */}
      <BlockEditorProvider value={blocks} onInput={updateBlocks} onChange={updateBlocks}>
          <WritingFlow>
              <ObserveTyping>
                  <BlockList />
              </ObserveTyping>
          </WritingFlow>
      </BlockEditorProvider>
    </SlotFillProvider>
  );
};
