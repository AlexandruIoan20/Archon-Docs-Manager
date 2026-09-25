import { describe, expect, it, vi, type Mock } from 'vitest'
import { join } from 'path'
import { exportFileName, saveExportFile, type SaveFileDeps } from './save-file'
import { assertPageSize, pdfPageHtml } from './svg-to-pdf'

interface MockDeps extends SaveFileDeps {
  showSaveDialog: Mock<SaveFileDeps['showSaveDialog']>
  rememberDir: Mock<SaveFileDeps['rememberDir']>
  writeFile: Mock<NonNullable<SaveFileDeps['writeFile']>>
}

function deps(result: { canceled: boolean; filePath?: string }): MockDeps {
  return {
    showSaveDialog: vi.fn<SaveFileDeps['showSaveDialog']>(() => Promise.resolve(result)),
    lastDir: () => '/home/me/Exports',
    rememberDir: vi.fn<SaveFileDeps['rememberDir']>(),
    writeFile: vi.fn<NonNullable<SaveFileDeps['writeFile']>>(() => Promise.resolve())
  }
}

describe('saveExportFile', () => {
  it('returns canceled, writes nothing and never builds the data', async () => {
    const d = deps({ canceled: true })
    const build = vi.fn(() => Promise.resolve('pdf'))
    await expect(saveExportFile('Phishing', 'svg', build, d)).resolves.toEqual({ canceled: true })
    expect(build).not.toHaveBeenCalled()
    expect(d.writeFile).not.toHaveBeenCalled()
    expect(d.rememberDir).not.toHaveBeenCalled()
  })

  it('opens in the last folder with <title>.<ext> and a filter for the format', async () => {
    const d = deps({ canceled: true })
    await saveExportFile('Phishing triage', 'png', new Uint8Array([1]), d)
    expect(d.showSaveDialog).toHaveBeenCalledWith({
      title: 'Export as PNG',
      defaultPath: join('/home/me/Exports', 'Phishing triage.png'),
      filters: [{ name: 'PNG image', extensions: ['png'] }]
    })
  })

  it('writes to the chosen path and remembers its folder', async () => {
    const d = deps({ canceled: false, filePath: '/tmp/out/diagram.svg' })
    await expect(saveExportFile('x', 'svg', '<svg/>', d)).resolves.toEqual({
      path: '/tmp/out/diagram.svg'
    })
    expect(d.writeFile).toHaveBeenCalledWith('/tmp/out/diagram.svg', '<svg/>')
    expect(d.rememberDir).toHaveBeenCalledWith('/tmp/out')
  })

  it('rejects unknown formats and data of the wrong type', async () => {
    const d = deps({ canceled: false, filePath: '/tmp/a.exe' })
    await expect(saveExportFile('x', 'exe' as never, 'x', d)).rejects.toMatchObject({
      code: 'INVALID_ARGUMENT'
    })
    await expect(saveExportFile('x', 'svg', 42 as never, d)).rejects.toMatchObject({
      code: 'INVALID_ARGUMENT'
    })
    expect(d.writeFile).not.toHaveBeenCalled()
  })
})

describe('exportFileName', () => {
  it('keeps the title, without path parts or forbidden characters', () => {
    expect(exportFileName('Login: flow?', 'pdf')).toBe('Login- flow-.pdf')
    expect(exportFileName('../../etc/passwd', 'svg')).toBe('passwd.svg')
    expect(exportFileName('  ', 'xmi')).toBe('diagram.xmi')
  })
})

describe('the PDF page', () => {
  it('is exactly the size of the SVG, without margins or scripts', () => {
    const html = pdfPageHtml('<svg></svg>', 320, 180)
    expect(html).toContain('@page { size: 320px 180px; margin: 0 }')
    expect(html).toContain("default-src 'none'")
    expect(html).toContain('<body><svg></svg></body>')
  })

  it('refuses empty or huge pages', () => {
    expect(() => assertPageSize(0, 10)).toThrow()
    expect(() => assertPageSize(10, 50_000)).toThrow()
    expect(() => assertPageSize(800, 600)).not.toThrow()
  })
})
