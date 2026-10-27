import { describe, expect, it } from 'vitest';

import { ConfigActionType } from './ConfigActionType';

describe('ConfigActionType', () => {
  it('should have unique action type values', () => {
    const actionTypeValues = Object.values(ConfigActionType);
    const uniqueValues = new Set(actionTypeValues);
    expect(uniqueValues.size).toBe(actionTypeValues.length);
  });

  it('should have the correct action type for GetSecret', () => {
    expect(ConfigActionType.GetSecret).toBe('@quidproquo-core/Config/GetSecret');
  });

  it('should have the correct action type for GetParameter', () => {
    expect(ConfigActionType.GetParameter).toBe('@quidproquo-core/Config/GetParameter');
  });

  it('should have the correct action type for SetParameter', () => {
    expect(ConfigActionType.SetParameter).toBe('@quidproquo-core/Config/SetParameter');
  });

  it('should have the correct action type for GetParameters', () => {
    expect(ConfigActionType.GetParameters).toBe('@quidproquo-core/Config/GetParameters');
  });

  it('should have the correct action type for ListParameters', () => {
    expect(ConfigActionType.ListParameters).toBe('@quidproquo-core/Config/ListParameters');
  });

  it('should have the correct action type for GetApplicationInfo', () => {
    expect(ConfigActionType.GetApplicationInfo).toBe('@quidproquo-core/Config/GetApplicationInfo');
  });

  it('should have the correct action type for GetGlobal', () => {
    expect(ConfigActionType.GetGlobal).toBe('@quidproquo-core/Config/GetGlobal');
  });

  it('should contain all expected action types', () => {
    const expectedActionTypes = ['GetSecret', 'GetParameter', 'SetParameter', 'GetParameters', 'ListParameters', 'GetApplicationInfo', 'GetGlobal'];

    const actualActionTypes = Object.keys(ConfigActionType);
    expect(actualActionTypes).toEqual(expect.arrayContaining(expectedActionTypes));
    expect(actualActionTypes.length).toBe(expectedActionTypes.length);
  });
});
