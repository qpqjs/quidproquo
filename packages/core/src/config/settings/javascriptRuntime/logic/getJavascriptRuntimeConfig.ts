import { getConfigSetting } from '../../../../logic/config/getConfigSetting';
import { QPQConfig, QPQCoreConfigSettingType } from '../../../QPQConfig';
import { defineJavascriptRuntime } from '../defineJavascriptRuntime';
import { JavascriptRuntimeQPQConfigSetting } from '../types';

// Always resolves: a service that declares no runtime gets the defineJavascriptRuntime defaults.
export const getJavascriptRuntimeConfig = (qpqConfig: QPQConfig): JavascriptRuntimeQPQConfigSetting =>
  getConfigSetting<JavascriptRuntimeQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.javascriptRuntime) ?? defineJavascriptRuntime();
