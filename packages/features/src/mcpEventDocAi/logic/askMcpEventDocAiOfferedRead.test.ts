import { ConfigActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { buildEventDocStore } from '../../eventDoc/context/buildEventDocStore';
import { buildEventDocAiSetChatNameTool } from '../../eventDocAi/config/logic/buildEventDocAiSetChatNameTool';
import { McpEventDocAiActionType } from '../actions/McpEventDocAiActionType';
import { McpEventDocAi } from '../models/McpEventDocAi';
import { askMcpEventDocAiOfferedRead } from './askMcpEventDocAiOfferedRead';

const eventDocAi: McpEventDocAi = {
  isCollection: true,
  aiName: 'notes-ai',
  serviceName: 'notes',
  type: 'note',
  store: buildEventDocStore({ storeName: 'notes', type: 'note' }),
  tools: [
    { name: 'readNote', description: 'Read the note', executor: 'readNoteFn', inputSchema: {} },
    { name: 'editNote', description: 'Edit the note', executor: 'editNoteFn', inputSchema: {} },
    buildEventDocAiSetChatNameTool('notes'),
  ],
};

const offered = (excludeTools: string[]) =>
  runStory(askMcpEventDocAiOfferedRead(), {
    [McpEventDocAiActionType.ReadConfig]: [eventDocAi],
    [ConfigActionType.GetGlobal]: excludeTools,
  })[0]!.tools.map((tool) => tool.name);

describe('askMcpEventDocAiOfferedRead', () => {
  // The toolset is used outside a chat, where there is no chat to name.
  it('never offers the tool that names a chat', () => {
    expect(offered([])).toEqual(['readNote', 'editNote']);
  });

  it("still leaves out the toolset's own excluded tools", () => {
    expect(offered(['editNote'])).toEqual(['readNote']);
  });
});
