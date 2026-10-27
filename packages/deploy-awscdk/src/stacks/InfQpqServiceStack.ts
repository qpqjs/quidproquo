import { qpqCoreUtils } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { Construct } from 'constructs';

import { requireDomainResolver } from '../appWorkspace/requireDomainResolver';
import {
  QpqCoreAiConstruct,
  QpqCoreApiGraphDatabaseConstruct,
  QpqCoreCryptoKeyConstruct,
  QpqCoreEventBusConstruct,
  QpqCoreKeyValueStoreConstruct,
  QpqCoreParameterConstruct,
  QpqCoreQueueConstruct,
  QpqCoreSecretConstruct,
  QpqCoreSigningKeyConstruct,
  QpqCoreStorageDriveConstruct,
  QpqInfCoreUserDirectoryConstruct,
  QpqWebserverApiKeyConstruct,
  QpqWebserverCertificateConstruct,
  QpqWebserverEmailSenderConstruct,
  QpqWebserverWebsocketConstruct,
} from '../constructs';
import { WebserverRoll } from '../constructs/basic/WebserverRoll';
import { OwnedCryptoKeys, resolveCryptoKeyForResource } from '../constructs/feature/core/cryptoKey/resolveCryptoKeyForResource';
import { QpqWebServerCacheConstruct } from '../constructs/feature/webserver/cache/QpqWebServerCacheConstruct';
import { emailReceiptRuleName } from '../constructs/feature/webserver/emailReceiving/emailReceiptRuleName';
import { QpqServiceStack, QpqServiceStackProps } from './base/QpqServiceStack';

export interface InfQpqServiceStackProps extends QpqServiceStackProps {}

export class InfQpqServiceStack extends QpqServiceStack {
  constructor(scope: Construct, id: string, props: InfQpqServiceStackProps) {
    super(scope, id, props);

    // Build the role for this service.
    const webserverRole = new WebserverRoll(this, 'webserverRoll', {
      qpqConfig: props.qpqConfig,
    }).role;

    // Crypto keys come first: drives and stores below encrypt with them by name.
    // Crypto and signing keys are both KMS keys aliased by bare name, so a shared
    // name is two aliases on one string; refuse it here rather than in the change set.
    const signingKeyNames = new Set(qpqCoreUtils.getOwnedSigningKeys(props.qpqConfig).map((setting) => setting.keyName));
    const ownedCryptoKeys: OwnedCryptoKeys = {};
    for (const setting of qpqCoreUtils.getOwnedCryptoKeys(props.qpqConfig)) {
      if (signingKeyNames.has(setting.keyName)) {
        throw new Error(`Crypto key "${setting.keyName}" shares its name with a signing key; both are KMS aliases, so the names must differ`);
      }

      ownedCryptoKeys[setting.keyName] = new QpqCoreCryptoKeyConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
        qpqConfig: props.qpqConfig,

        cryptoKeyConfig: setting,
      }).key;
    }
    QpqCoreCryptoKeyConstruct.authorizeActionsForRole(webserverRole, qpqCoreUtils.getAllCryptoKeyConfigs(props.qpqConfig), props.qpqConfig);
    // end crypto keys

    // A drive a receiver writes into is written by the account's receipt rule of that name.
    const emailReceiptRuleNamesForDrive = (storageDriveName: string): string[] =>
      qpqWebServerUtils.getEmailReceiversForStorageDrive(props.qpqConfig, storageDriveName).map((r) => emailReceiptRuleName(props.qpqConfig, r.name));

    // Build the storage drives
    qpqCoreUtils.getOwnedStorageDrives(props.qpqConfig).map(
      (setting) =>
        new QpqCoreStorageDriveConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          storageDriveConfig: setting,

          corsAllowedOrigins: qpqWebServerUtils.getStorageDriveCorsAllowedOrigins(
            props.qpqConfig,
            setting.storageDrive,
            requireDomainResolver(props.qpqConfig),
          ),
          allowCloudFrontRead: qpqWebServerUtils.isStorageDriveWebEntryOrigin(props.qpqConfig, setting.storageDrive),
          serviceRole: webserverRole,
          cryptoKey: setting.cryptoKeyName
            ? resolveCryptoKeyForResource(this, `${setting.uniqueKey}-crypto-key`, props.qpqConfig, setting.cryptoKeyName, ownedCryptoKeys)
            : undefined,
          emailReceiptRuleNames: emailReceiptRuleNamesForDrive(setting.storageDrive),
        }),
    );
    QpqCoreStorageDriveConstruct.authorizeActionsForRole(this, webserverRole, props.qpqConfig);
    // end storage drives

    // Build the parameters
    const parameters = qpqCoreUtils.getOwnedParameterConfigs(props.qpqConfig).map(
      (setting) =>
        new QpqCoreParameterConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          parameterConfig: setting,
        }),
    );
    QpqCoreParameterConstruct.authorizeActionsForRole(this, webserverRole, qpqCoreUtils.getAllParameterConfigs(props.qpqConfig), props.qpqConfig);
    // end parameters

    // Secrets
    const secrets = qpqCoreUtils.getOwnedSecrets(props.qpqConfig).map(
      (setting) =>
        new QpqCoreSecretConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          secretConfig: setting,
        }),
    );
    QpqCoreSecretConstruct.authorizeActionsForRole(this, webserverRole, qpqCoreUtils.getAllSecretConfigs(props.qpqConfig), props.qpqConfig);
    // end secrets

    // Signing keys
    const signingKeys = qpqCoreUtils.getOwnedSigningKeys(props.qpqConfig).map(
      (setting) =>
        new QpqCoreSigningKeyConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          signingKeyConfig: setting,
        }),
    );
    QpqCoreSigningKeyConstruct.authorizeActionsForRole(webserverRole, qpqCoreUtils.getAllSigningKeyConfigs(props.qpqConfig), props.qpqConfig);
    // end signing keys

    // Queues
    const queues = qpqCoreUtils.getQueues(props.qpqConfig).map(
      (setting) =>
        new QpqCoreQueueConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          queueConfig: setting,
        }),
    );
    QpqCoreQueueConstruct.authorizeActionsForRole(webserverRole, queues);
    // end queues

    // User Directories
    const ownedUserDirectoriesConfigs = qpqCoreUtils.getOwnedUserDirectories(props.qpqConfig);
    const userDirectories = ownedUserDirectoriesConfigs.map(
      (setting) =>
        new QpqInfCoreUserDirectoryConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          userDirectoryConfig: setting,
        }),
    );
    QpqInfCoreUserDirectoryConstruct.authorizeAdminActionsForRole(webserverRole, ownedUserDirectoriesConfigs, userDirectories, props.qpqConfig);

    // Directories this service references but doesn't own: read-only user lookups.
    const referencedUserDirectoriesConfigs = qpqCoreUtils
      .getUserDirectories(props.qpqConfig)
      .filter((setting) => !ownedUserDirectoriesConfigs.includes(setting));
    QpqInfCoreUserDirectoryConstruct.authorizeReadActionsForRole(webserverRole, referencedUserDirectoriesConfigs, props.qpqConfig);

    // Api Keys
    const apiKeys = qpqWebServerUtils.getAllApiKeyConfigs(props.qpqConfig).map(
      (setting) =>
        new QpqWebserverApiKeyConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          apiKeyConfig: setting,
        }),
    );

    // Event Busses
    const eventBusses = qpqCoreUtils.getOwnedEventBusConfigs(props.qpqConfig).map(
      (setting) =>
        new QpqCoreEventBusConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          eventBusConfig: setting,
        }),
    );

    // key value store
    qpqCoreUtils.getOwnedKeyValueStores(props.qpqConfig).map(
      (setting) =>
        new QpqCoreKeyValueStoreConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          keyValueStoreConfig: setting,
          cryptoKey: setting.cryptoKeyName
            ? resolveCryptoKeyForResource(this, `${setting.uniqueKey}-crypto-key`, props.qpqConfig, setting.cryptoKeyName, ownedCryptoKeys)
            : undefined,
        }),
    );
    QpqCoreKeyValueStoreConstruct.authorizeActionsForRole(this, webserverRole, props.qpqConfig);
    // end key value store

    // Graph Databases
    const allGraphDatabaseConfigs = qpqCoreUtils.getAllGraphDatabaseConfigs(props.qpqConfig);
    const graphDatabases = qpqCoreUtils.getOwnedGraphDatabases(props.qpqConfig).map(
      (setting) =>
        new QpqCoreApiGraphDatabaseConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          graphDatabaseConfig: setting,
        }),
    );
    QpqCoreApiGraphDatabaseConstruct.authorizeActionsForRole(webserverRole, allGraphDatabaseConfigs, props.qpqConfig);
    // end key value store

    // AI (Bedrock)
    QpqCoreAiConstruct.authorizeActionsForRole(webserverRole, qpqCoreUtils.getAllAiConfigs(props.qpqConfig));
    // end AI

    // Build websocket apis
    const websockets = qpqWebServerUtils.getOwnedWebsocketSettings(props.qpqConfig).map(
      (setting) =>
        new QpqWebserverWebsocketConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          websocketConfig: setting,
        }),
    );
    QpqWebserverWebsocketConstruct.authorizeManageConnectionsForRole(webserverRole, websockets, props.qpqConfig);

    // Email senders (SES identities). The construct id is keyed by the primary root, not the
    // setting: an SES identity's physical id is the domain itself, so a changed logical id would
    // fail creation against the identity the stack already owns.
    const emailSenderConfigs = qpqWebServerUtils.getEmailSenderSettings(props.qpqConfig);
    const emailSenderConstructId = `EmailSender${qpqWebServerUtils.getPrimaryRootDomain(props.qpqConfig) ?? ''}`;
    emailSenderConfigs.map(
      (setting) =>
        new QpqWebserverEmailSenderConstruct(this, emailSenderConstructId, {
          qpqConfig: props.qpqConfig,

          emailSenderConfig: setting,
        }),
    );
    QpqWebserverEmailSenderConstruct.authorizeSendEmailForRole(webserverRole, emailSenderConfigs, props.qpqConfig);

    // Cache settings
    const cache = qpqWebServerUtils.getAllOwnedCacheConfigs(props.qpqConfig).map(
      (setting) =>
        new QpqWebServerCacheConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          cacheConfig: setting,
        }),
    );

    // Certifcates
    const certifcates = qpqWebServerUtils.getAllOwnedCertifcateConfigs(props.qpqConfig).map(
      (setting) =>
        new QpqWebserverCertificateConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          certificateConfig: setting,
        }),
    );
  }
}
