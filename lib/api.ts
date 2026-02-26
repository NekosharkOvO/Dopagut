/**
 * DopaGut API Facade
 * 此文件已被重构为各子服务的出口，以保持向后兼容性。
 */

export * from './services/auth.service';
export * from './services/profile.service';
export * from './services/log.service';
export * from './services/achievement.service';
export * from './services/friend.service';
export * from './services/test.service';

// 导出成就引擎，供特殊情况调用
export * from './achievements/engine';
