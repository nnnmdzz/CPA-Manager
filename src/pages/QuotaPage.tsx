/**
 * Quota management page - coordinates the three quota sections.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHeaderRefresh } from '@/hooks/useHeaderRefresh';
import { useAuthStore, useQuotaSettingsStore } from '@/stores';
import { authFilesApi, configFileApi } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { IconSearch, IconSettings } from '@/components/ui/icons';
import {
  QuotaSection,
  ANTIGRAVITY_CONFIG,
  CLAUDE_CONFIG,
  CODEX_CONFIG,
  GEMINI_CLI_CONFIG,
  KIMI_CONFIG
} from '@/components/quota';
import type { QuotaSortMode } from '@/components/quota/quotaConfigs';
import type { AuthFileItem } from '@/types';
import styles from './QuotaPage.module.scss';

export function QuotaPage() {
  const { t } = useTranslation();
  const connectionStatus = useAuthStore((state) => state.connectionStatus);

  const [files, setFiles] = useState<AuthFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<QuotaSortMode>('default');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { highThreshold, lowThreshold, setThresholds, resetThresholds } = useQuotaSettingsStore();
  const [draftHigh, setDraftHigh] = useState(highThreshold);
  const [draftLow, setDraftLow] = useState(lowThreshold);
  const thresholdError =
    draftHigh <= draftLow ? t('quota_management.threshold_validation') : '';

  const openSettings = () => {
    setDraftHigh(highThreshold);
    setDraftLow(lowThreshold);
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    if (thresholdError) return;
    setThresholds(draftHigh, draftLow);
    setSettingsOpen(false);
  };

  const disableControls = connectionStatus !== 'connected';
  const sortOptions = useMemo(
    () => [
      { value: 'default', label: t('quota_management.sort_default') },
      { value: 'name-asc', label: t('quota_management.sort_name_asc') },
      { value: 'plan-desc', label: t('quota_management.sort_plan_desc') },
      { value: 'plan-asc', label: t('quota_management.sort_plan_asc') }
    ],
    [t]
  );

  const loadConfig = useCallback(async () => {
    try {
      await configFileApi.fetchConfigYaml();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('notification.refresh_failed');
      setError((prev) => prev || errorMessage);
    }
  }, [t]);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFilesApi.list();
      setFiles(data?.files || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('notification.refresh_failed');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleHeaderRefresh = useCallback(async () => {
    await Promise.all([loadConfig(), loadFiles()]);
  }, [loadConfig, loadFiles]);

  useHeaderRefresh(handleHeaderRefresh);

  useEffect(() => {
    loadFiles();
    loadConfig();
  }, [loadFiles, loadConfig]);

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('quota_management.title')}</h1>
        <p className={styles.description}>{t('quota_management.description')}</p>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.toolbar}>
        <div className={styles.toolbarField}>
          <Input
            label={t('quota_management.search_label')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('quota_management.search_placeholder')}
            rightElement={<IconSearch size={16} />}
            aria-label={t('quota_management.search_label')}
          />
        </div>
        <div className={`${styles.toolbarField} ${styles.sortField}`}>
          <label htmlFor="quota-sort-mode" className={styles.toolbarLabel}>
            {t('quota_management.sort_label')}
          </label>
          <Select
            id="quota-sort-mode"
            value={sortMode}
            options={sortOptions}
            onChange={(value) => setSortMode(value as QuotaSortMode)}
            ariaLabel={t('quota_management.sort_label')}
            fullWidth
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={openSettings}
          title={t('quota_management.display_settings')}
          aria-label={t('quota_management.display_settings')}
        >
          <IconSettings size={16} />
        </Button>
      </div>

      <Modal
        open={settingsOpen}
        title={t('quota_management.display_settings')}
        onClose={() => setSettingsOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" onClick={() => { resetThresholds(); setSettingsOpen(false); }}>
              {t('quota_management.threshold_reset')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setSettingsOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={saveSettings} disabled={!!thresholdError}>
              {t('quota_management.threshold_save')}
            </Button>
          </div>
        }
        width={360}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
          <Input
            label={t('quota_management.high_threshold_label')}
            type="number"
            min={1}
            max={99}
            value={draftHigh}
            onChange={(e) => setDraftHigh(Number(e.target.value))}
            hint={t('quota_management.high_threshold_hint')}
          />
          <Input
            label={t('quota_management.low_threshold_label')}
            type="number"
            min={1}
            max={99}
            value={draftLow}
            onChange={(e) => setDraftLow(Number(e.target.value))}
            hint={t('quota_management.low_threshold_hint')}
            error={thresholdError}
          />
        </div>
      </Modal>

      <QuotaSection
        config={CODEX_CONFIG}
        files={files}
        loading={loading}
        disabled={disableControls}
        searchQuery={searchQuery}
        sortMode={sortMode}
      />
      <QuotaSection
        config={CLAUDE_CONFIG}
        files={files}
        loading={loading}
        disabled={disableControls}
        searchQuery={searchQuery}
        sortMode={sortMode}
      />
      <QuotaSection
        config={ANTIGRAVITY_CONFIG}
        files={files}
        loading={loading}
        disabled={disableControls}
        searchQuery={searchQuery}
        sortMode={sortMode}
      />
      <QuotaSection
        config={GEMINI_CLI_CONFIG}
        files={files}
        loading={loading}
        disabled={disableControls}
        searchQuery={searchQuery}
        sortMode={sortMode}
      />
      <QuotaSection
        config={KIMI_CONFIG}
        files={files}
        loading={loading}
        disabled={disableControls}
        searchQuery={searchQuery}
        sortMode={sortMode}
      />
    </div>
  );
}
