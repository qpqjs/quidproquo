import { describe, expect, it } from 'vitest';

import { askDateNow } from '../../actions/date/askDateNow';
import { DateActionType } from '../../actions/date/DateActionType';
import { askNewGuid } from '../../actions/guid/askNewGuid';
import { GuidActionType } from '../../actions/guid/GuidActionType';
import { askRandomNumber } from '../../actions/math/askRandomNumber';
import { MathActionType } from '../../actions/math/MathActionType';
import { expectError, runStory, throwsError } from '../../testing/storyTesting';
import { AskResponse, EitherActionResult } from '../../types';
import { askCatch } from './askCatch';
import { askRunParallel } from './askRunParallel';

describe('askRunParallel', () => {
  it('returns the results of every story in input order', () => {
    const result = runStory(askRunParallel([askRandomNumber(), askDateNow(), askNewGuid()]), {
      [MathActionType.RandomNumber]: 0.5,
      [DateActionType.Now]: 'now',
      [GuidActionType.New]: 'guid-1',
    });

    expect(result).toEqual([0.5, 'now', 'guid-1']);
  });

  it('returns an empty array for no stories without yielding anything', () => {
    const iterator = askRunParallel([]);
    const first = iterator.next();

    expect(first.done).toBe(true);
    expect(first.value).toEqual([]);
  });

  it('keeps result order when stories finish after different numbers of steps', () => {
    function* longStory(): AskResponse<string> {
      const a = yield* askNewGuid();
      const b = yield* askNewGuid();
      return `${a}+${b}`;
    }
    function* shortStory(): AskResponse<number> {
      return yield* askRandomNumber();
    }

    let guidCount = 0;
    const nextGuid = () => `g${++guidCount}`;

    const result = runStory(askRunParallel([longStory(), shortStory()]), {
      [GuidActionType.New]: nextGuid,
      [MathActionType.RandomNumber]: 0.5,
    });

    // The short story finished a round earlier, but its result stays in slot 2
    expect(result).toEqual(['g1+g2', 0.5]);
  });

  it('runs the stories in batched lockstep rounds', () => {
    const rounds: string[][] = [];
    let round: string[] = [];

    // Record which actions land in the same lockstep round: mocks run in batch order,
    // so a new round starts whenever the guid mock fires after a math mock.
    const recordGuid = () => {
      round.push('guid');
      return 'g';
    };
    const recordRandom = () => {
      rounds.push(round);
      round = [];
      return 1;
    };

    function* guidTwice(): AskResponse<void> {
      yield* askNewGuid();
      yield* askNewGuid();
    }
    function* randomTwice(): AskResponse<void> {
      yield* askRandomNumber();
      yield* askRandomNumber();
    }

    runStory(askRunParallel([guidTwice(), randomTwice()]), {
      [GuidActionType.New]: recordGuid,
      [MathActionType.RandomNumber]: recordRandom,
    });

    // Each round contains exactly one action from each still-active story
    expect(rounds).toEqual([['guid'], ['guid']]);
  });

  it('propagates a failure to an enclosing askCatch', () => {
    function* story(): AskResponse<EitherActionResult<[number, string]>> {
      return yield* askCatch(askRunParallel([askRandomNumber(), askDateNow()]));
    }

    const result = runStory(story(), {
      [MathActionType.RandomNumber]: 0.5,
      [DateActionType.Now]: throwsError('GenericError', 'date service down'),
    });

    expect(expectError(result).errorText).toBe('date service down');
  });
});
