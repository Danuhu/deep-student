import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { normalizeSupportedLanguage, supportedLanguages } from '@/types/i18n';

const waitFor = async (fn: () => boolean, ms = 5000) => {
  const t0 = Date.now();
  while (!fn()) {
    if (Date.now() - t0 > ms) throw new Error('timeout');
    await new Promise((r) => setTimeout(r, 25));
  }
};

describe('pt-BR', () => {
  it('está na lista de idiomas suportados', () => {
    expect(supportedLanguages.map((l) => l.code)).toContain('pt-BR');
    expect(i18n.options.supportedLngs).toContain('pt-BR');
  });

  it('normaliza variantes do português', () => {
    expect(normalizeSupportedLanguage('pt')).toBe('pt-BR');
    expect(normalizeSupportedLanguage('pt-BR')).toBe('pt-BR');
    expect(normalizeSupportedLanguage('pt-PT')).toBe('pt-BR');
    expect(normalizeSupportedLanguage('PT-br')).toBe('pt-BR');
  });

  it('troca para pt-BR e resolve os textos do núcleo', async () => {
    await i18n.changeLanguage('pt-BR');
    expect(i18n.language).toBe('pt-BR');
    expect(i18n.t('actions.save')).toBe('Salvar');
    expect(i18n.t('sidebar:navigation.learning_hub')).toBe('Central de Estudos');
    expect(i18n.t('sidebar:navigation.exam_sheet')).toBe('Banco de Questões');
  });

  it('carrega namespaces sob demanda (practice)', async () => {
    await waitFor(() => i18n.hasResourceBundle('pt-BR', 'practice'));
    expect(i18n.t('practice:modes.mockExam.label')).toBe('Simulado');
    expect(i18n.t('practice:modes.reviewOnly.label')).toBe('Caderno de erros');
    expect(i18n.t('practice:tagNav.knowledgePoints')).toBe('Assuntos');
  });

  it('interpola variáveis sem quebrar', async () => {
    expect(i18n.t('practice:timed.lastResultSummary', { answered: 8, total: 10, correct: 7, rate: 70 }))
      .toBe('8 de 10 respondidas · 7 acertos · 70% de aproveitamento');
  });

  it('cai para o inglês no que ainda não foi traduzido, sem mostrar a chave crua', async () => {
    const v = i18n.t('chatV2:queue.settings.modeTitle');
    expect(v).not.toBe('queue.settings.modeTitle');
    expect(v.length).toBeGreaterThan(0);
  });
});
