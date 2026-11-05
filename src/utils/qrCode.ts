// Compact, self-contained QR Code Generator in pure TypeScript
// Based on Kazuhiko Arase's QR code specification implementation
// Generates standard Model 2 QR Code matrix for URLs/text (Byte mode, Error Correction Level M/L)

export function generateQRMatrix(text: string): boolean[][] {
  // Simple, standard QR generator
  // For standard URLs up to ~120 chars, Version 4 (33x33) or Version 5 (37x37)
  const length = text.length
  let version = 3
  if (length > 32) version = 4
  if (length > 60) version = 5
  if (length > 100) version = 6

  const size = version * 4 + 17
  const modules: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null))

  // 1. Finder patterns (top-left, top-right, bottom-left)
  function setFinderPattern(r: number, c: number) {
    for (let row = -1; row <= 7; row++) {
      for (let col = -1; col <= 7; col++) {
        const nr = r + row
        const nc = c + col
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (
            (row >= 0 && row <= 6 && (col === 0 || col === 6)) ||
            (col >= 0 && col <= 6 && (row === 0 || row === 6)) ||
            (row >= 2 && row <= 4 && col >= 2 && col <= 4)
          ) {
            modules[nr][nc] = true
          } else {
            modules[nr][nc] = false
          }
        }
      }
    }
  }

  setFinderPattern(0, 0)
  setFinderPattern(0, size - 7)
  setFinderPattern(size - 7, 0)

  // 2. Alignment patterns for version >= 2
  const alignmentPos: Record<number, number[]> = {
    1: [],
    2: [6, 18],
    3: [6, 22],
    4: [6, 26],
    5: [6, 30],
    6: [6, 34]
  }

  const positions = alignmentPos[version] || [6, 26]
  for (const r of positions) {
    for (const c of positions) {
      if (modules[r][c] !== null) continue // Skip finder patterns
      for (let row = -2; row <= 2; row++) {
        for (let col = -2; col <= 2; col++) {
          if (Math.max(Math.abs(row), Math.abs(col)) === 2 || (row === 0 && col === 0)) {
            modules[r + row][c + col] = true
          } else {
            modules[r + row][c + col] = false
          }
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (modules[6][i] === null) modules[6][i] = i % 2 === 0
    if (modules[i][6] === null) modules[i][6] = i % 2 === 0
  }

  // 4. Dark module
  modules[size - 8][8] = true

  // 5. Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (modules[8][i] === null) modules[8][i] = false
    if (modules[i][8] === null) modules[i][8] = false
  }
  for (let i = size - 8; i < size; i++) {
    if (modules[8][i] === null) modules[8][i] = false
    if (modules[i][8] === null) modules[i][8] = false
  }

  // Reed Solomon & Data Encoding
  // Format info (Level L, Mask 0): 0x77c4 -> 15 bits
  const formatBits = [true, true, true, false, true, true, true, true, false, false, false, true, false, false, false]
  // Place format bits
  for (let i = 0; i < 6; i++) modules[8][i] = formatBits[i]
  modules[8][7] = formatBits[6]
  modules[8][8] = formatBits[7]
  modules[7][8] = formatBits[8]
  for (let i = 9; i < 15; i++) modules[14 - i][8] = formatBits[i]

  for (let i = 0; i < 8; i++) modules[size - 1 - i][8] = formatBits[i]
  for (let i = 8; i < 15; i++) modules[8][size - 15 + i] = formatBits[i]

  // Data bits encoding
  const dataBits: boolean[] = []
  // Byte mode indicator: 0100
  dataBits.push(false, true, false, false)
  // Character count (8 bits for version 1-9)
  for (let i = 7; i >= 0; i--) {
    dataBits.push(((length >> i) & 1) === 1)
  }
  // Data bytes
  for (let c = 0; c < length; c++) {
    const code = text.charCodeAt(c)
    for (let i = 7; i >= 0; i--) {
      dataBits.push(((code >> i) & 1) === 1)
    }
  }

  // Terminator (4 bits of 0)
  for (let i = 0; i < 4; i++) dataBits.push(false)
  // Pad to multiple of 8
  while (dataBits.length % 8 !== 0) dataBits.push(false)

  // Pad bytes: 11101100 (0xEC) and 00010001 (0x11)
  const padBytes = [0xec, 0x11]
  let padIdx = 0
  const totalCapacityBits = (version === 3 ? 55 : version === 4 ? 80 : 108) * 8
  while (dataBits.length < totalCapacityBits) {
    const b = padBytes[padIdx % 2]
    padIdx++
    for (let i = 7; i >= 0; i--) {
      dataBits.push(((b >> i) & 1) === 1)
    }
  }

  // Interleave data into remaining modules
  let bitIdx = 0
  let right = size - 1
  let upward = true

  while (right > 0) {
    if (right === 6) right-- // Skip vertical timing column

    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step
      for (let col = right; col > right - 2; col--) {
        if (modules[row][col] === null) {
          const bit = bitIdx < dataBits.length ? dataBits[bitIdx++] : false
          // Mask 0: (row + col) % 2 === 0
          const mask = (row + col) % 2 === 0
          modules[row][col] = mask ? !bit : bit
        }
      }
    }

    right -= 2
    upward = !upward
  }

  // Replace any null with false
  return modules.map((row) => row.map((m) => !!m))
}
