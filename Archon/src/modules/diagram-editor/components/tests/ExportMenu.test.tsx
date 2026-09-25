import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EditorTabRef, SoarDiagram } from '@/core/types'
import { useEditorStore, useUiStore } from '@/store'
import { TitleBarDensityContext } from '@/shared/components/layout/title-bar/TitleBarDensityContext'
import { createSoarApiMock, type SoarApiMock } from '@/test/soar-api-mock'
import { ok } from '@/test/workspace-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { PHISHING } from '@/test/sample-diagram'
import type { DiagramStoreApi } from '../../store/diagram.store'
import { getStore } from '../../store/store-registry'
import { DiagramEditor } from '../DiagramEditor'
import { ExportMenu } from '../toolbar/ExportMenu'

const htmlToImage = vi.hoisted(() => ({
  toSvg: vi.fn(() => Promise.resolve('data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E')),
  toPng: vi.fn(() => Promise.resolve(`data:image/png;base64,${btoa('PNG')}`))
}))
vi.mock('html-to-image', () => htmlToImage)

const initial = { editor: useEditorStore.getState(), ui: useUiStore.getState() }
const toast = (): string | undefined => useUiStore.getState().toast?.message

describe('ExportMenu', () => {
  let mock: SoarApiMock
  let tab: EditorTabRef

  async function renderMenu(
    diagram: SoarDiagram = PHISHING,
    density: 'full' | 'minimal' = 'full'
  ): Promise<DiagramStoreApi> {
    mock.api.fs.readDiagram.mockResolvedValue(ok(diagram))
    render(
      <TitleBarDensityContext.Provider value={density}>
        <ExportMenu tab={tab} />
        <DiagramEditor tab={tab} />
      </TitleBarDensityContext.Provider>,
      { wrapper: queryWrapper() }
    )
    await waitFor(() => expect(getStore(tab.tabId)).toBeDefined())
    await screen.findByRole('button', { name: 'Export' })
    return getStore(tab.tabId) as DiagramStoreApi
  }

  const openMenu = (): HTMLElement => {
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    return screen.getByRole('menu', { name: 'Export as' })
  }

  beforeEach(() => {
    useEditorStore.setState(initial.editor, true)
    useUiStore.setState(initial.ui, true)
    htmlToImage.toSvg.mockClear()
    htmlToImage.toPng.mockClear()
    mock = createSoarApiMock({ platform: 'linux' })
    window.soar = mock.api
    const tabId = useEditorStore.getState().openFile('flows/phishing.soardiag', 'soardiag')
    tab = { tabId, filePath: 'flows/phishing.soardiag', kind: 'soardiag' }
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.soar
  })

  it('lists the four formats with their extensions', async () => {
    await renderMenu()
    const items = within(openMenu()).getAllByRole('menuitem')
    expect(items.map((item) => item.textContent)).toEqual([
      'PNG.png',
      'SVG.svg',
      'PDF.pdf',
      'UML XMI.xmi'
    ])
  })

  it('disables XMI for a sequence diagram, with the reason', async () => {
    await renderMenu({ ...PHISHING, type: 'sequence' })
    const xmi = within(openMenu()).getByRole('menuitem', { name: /UML XMI/ })
    expect(xmi).toBeDisabled()
    expect(xmi).toHaveAttribute('title', 'Not available for this diagram type')
  })

  it('shows an icon button in the minimal title bar', async () => {
    await renderMenu(PHISHING, 'minimal')
    expect(screen.getByRole('button', { name: 'Export' })).not.toHaveTextContent('Export')
  })

  it('shows no success toast when the save dialog is cancelled', async () => {
    const store = await renderMenu()
    fireEvent.click(within(openMenu()).getByRole('menuitem', { name: /SVG/ }))
    await waitFor(() => expect(mock.api.export.save).toHaveBeenCalledOnce())
    await waitFor(() => expect(toast()).toBeUndefined())
    expect(mock.api.fs.writeDiagram).not.toHaveBeenCalled()
    expect(store.getState().meta.exportedAt).toBeNull()
  })

  it('exports the canvas as SVG, then records exportedAt without a dirty tab', async () => {
    mock.api.export.save.mockResolvedValue(ok({ path: '/home/me/Phishing triage.svg' }))
    const store = await renderMenu()
    const viewport = { ...store.getState().viewport }
    act(() => store.getState().onNodesChange([{ type: 'select', id: 'N1', selected: true }]))

    fireEvent.click(within(openMenu()).getByRole('menuitem', { name: /SVG/ }))
    expect(toast()).toBe('Exporting Phishing triage.svg as SVG')
    await waitFor(() => expect(toast()).toBe('Exported to /home/me/Phishing triage.svg'))

    expect(mock.api.export.save).toHaveBeenCalledWith({
      defaultName: 'Phishing triage',
      extension: 'svg',
      data: '<svg></svg>'
    })
    await waitFor(() => expect(mock.api.fs.writeDiagram).toHaveBeenCalledOnce())
    const written = mock.api.fs.writeDiagram.mock.calls[0]?.[1]
    expect(written?.exportedAt).toEqual(expect.any(String))
    expect(useEditorStore.getState().tabs[0]?.dirty).toBe(false)
    expect(store.getState().viewport).toEqual(viewport)
    expect(store.getState().selection.nodes).toEqual(['N1'])
  })

  it('sends PDF as the SVG and its size', async () => {
    await renderMenu()
    fireEvent.click(within(openMenu()).getByRole('menuitem', { name: /PDF/ }))
    await waitFor(() => expect(mock.api.export.pdfFromSvg).toHaveBeenCalledOnce())
    expect(mock.api.export.pdfFromSvg.mock.calls[0]?.[0]).toMatchObject({
      defaultName: 'Phishing triage',
      svg: '<svg></svg>',
      width: expect.any(Number),
      height: expect.any(Number)
    })
  })

  it('shows the error when the export fails', async () => {
    mock.api.export.save.mockResolvedValue({
      ok: false,
      error: { code: 'IO_ERROR', message: 'Disk full' }
    })
    await renderMenu()
    fireEvent.click(within(openMenu()).getByRole('menuitem', { name: /PNG/ }))
    await waitFor(() => expect(toast()).toBe('Export failed: Disk full'))
    expect(useUiStore.getState().toast?.tone).toBe('error')
  })
})
