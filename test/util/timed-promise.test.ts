import { expect } from '@open-wc/testing';
import { timedPromise, TimeoutError } from '../../src/util/timed-promise';

describe('timedPromise', () => {
  it('rejects with a TimeoutError when the time limit is exceeded', async () => {
    const longPromise = new Promise(resolve => setTimeout(resolve, 500));

    try {
      await timedPromise(longPromise, 200);
      expect.fail('timed promise did not reject');
    } catch (err) {
      expect(err).to.be.instanceOf(TimeoutError);
      expect(err).to.satisfy((e: Error) => e.message === 'Operation timed out');
    }
  });

  it('allows setting the time-out message', async () => {
    const longPromise = new Promise(resolve => setTimeout(resolve, 500));

    try {
      await timedPromise(longPromise, 200, 'foo');
      expect.fail('timed promise did not reject');
    } catch (err) {
      expect(err).to.be.instanceOf(TimeoutError);
      expect(err).to.satisfy((e: Error) => e.message === 'foo');
    }
  });

  it('fulfills if the given promise fulfills within the time limit', async () => {
    const shortPromise = new Promise(resolve =>
      setTimeout(resolve, 100, 'foo')
    );

    try {
      const result = await timedPromise(shortPromise, 200);
      expect(result).to.equal('foo');
    } catch (err) {
      expect.fail('promise timed out');
    }
  });

  it('rejects if the given promise rejects within the time limit', async () => {
    const shortPromise = new Promise((_, reject) =>
      setTimeout(reject, 100, 'foo')
    );

    try {
      await timedPromise(shortPromise, 200);
      expect.fail('promise did not reject');
    } catch (err) {
      expect(err).to.equal('foo');
    }
  });

  it('immediately fulfills with any non-promise value given, regardless of time limit', async () => {
    try {
      const result = await timedPromise('foo', 0);
      expect(result).to.equal('foo');
    } catch (err) {
      expect.fail('promise timed out');
    }
  });
});
