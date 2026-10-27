import { describe, expect, it } from 'vitest';

import { runStory, StoryError, throwsError } from '../../testing';
import { AskResponse } from '../../types';
import { askNewGuid } from '../guid/askNewGuid';
import { GuidActionType } from '../guid/GuidActionType';
import { askRandomNumber } from '../math/askRandomNumber';
import { MathActionType } from '../math/MathActionType';
import { askParallelDEPRECATED } from './askParallelDEPRECATED';

describe('askParallelDEPRECATED', () => {
  it('runs each story and returns their results positionally', () => {
    function* storyA(): AskResponse<number> {
      return yield* askRandomNumber();
    }
    function* storyB(): AskResponse<string> {
      return yield* askNewGuid();
    }

    const result = runStory(askParallelDEPRECATED([[storyA], [storyB]]), {
      [MathActionType.RandomNumber]: 0.5,
      [GuidActionType.New]: 'abc',
    });

    expect(result).toEqual([0.5, 'abc']);
  });

  it('passes the trailing tuple entries as story arguments', () => {
    function* echo(prefix: string): AskResponse<string> {
      const guid = yield* askNewGuid();
      return `${prefix}-${guid}`;
    }

    const result = runStory(
      askParallelDEPRECATED([
        [echo, 'first'],
        [echo, 'second'],
      ]),
      {
        [GuidActionType.New]: 'g',
      },
    );

    expect(result).toEqual(['first-g', 'second-g']);
  });

  it('keeps stepping longer stories after shorter ones finish', () => {
    // Regression: a finished story used to leave a null hole in the batch sent to the
    // runtime, which crashed the batch processor. The pending action must be batched
    // alone and its result routed back to the right story.
    function* shortStory(): AskResponse<string> {
      return yield* askNewGuid();
    }
    function* longStory(): AskResponse<string> {
      const first = yield* askNewGuid();
      const second = yield* askNewGuid();
      return `${first}+${second}`;
    }

    let guidCount = 0;
    const result = runStory(askParallelDEPRECATED([[longStory], [shortStory]]), {
      [GuidActionType.New]: () => `g${++guidCount}`,
    });

    expect(result).toEqual(['g1+g3', 'g2']);
  });

  it('propagates a failing action in one of the stories as a thrown error', () => {
    function* storyA(): AskResponse<number> {
      return yield* askRandomNumber();
    }
    function* storyB(): AskResponse<string> {
      return yield* askNewGuid();
    }

    const run = () =>
      runStory(askParallelDEPRECATED([[storyA], [storyB]]), {
        [MathActionType.RandomNumber]: 0.5,
        [GuidActionType.New]: throwsError('GenericError', 'guid service down'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('guid service down');
  });
});
