import fs from 'fs'
import path from 'path'
import { Config, optimize, Output } from 'svgo'

import svgoConfig from '../svgo.config.mjs'

// Target directory (customize this path)
const targetDir = './src/assets/maps'

// Statistics tracking
interface OptimizationStats {
  originalSize: number
  optimizedSize: number
  reduction: number
  percentage: number
}

const globalStats = {
  totalFiles: 0,
  totalOriginalSize: 0,
  totalOptimizedSize: 0,
  fileStats: new Map<string, OptimizationStats>(),
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Recursively optimizes all SVGs in a directory and its subdirectories.
 */
function optimizeSvgsInDirectory(dir: string): void {
  const files: string[] = fs.readdirSync(dir)

  files.forEach((file: string) => {
    const fullPath: string = path.join(dir, file)
    const stat: fs.Stats = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      optimizeSvgsInDirectory(fullPath) // Recurse into subdirectories
    } else if (path.extname(file).toLowerCase() === '.svg') {
      optimizeSvgFile(fullPath) // Optimize SVG files
    }
  })
}

/**
 * Optimizes a single SVG file and tracks statistics.
 */
function optimizeSvgFile(filePath: string): void {
  try {
    const svgContent: string = fs.readFileSync(filePath, 'utf8')
    const originalSize: number = Buffer.byteLength(svgContent, 'utf8')
    const result: Output = optimize(svgContent, svgoConfig as Config)

    const optimizedSize: number = Buffer.byteLength(result.data, 'utf8')
    const reduction: number = originalSize - optimizedSize
    const percentage: number = (reduction / originalSize) * 100

    // Update global statistics
    globalStats.totalFiles++
    globalStats.totalOriginalSize += originalSize
    globalStats.totalOptimizedSize += optimizedSize
    globalStats.fileStats.set(filePath, {
      originalSize,
      optimizedSize,
      reduction,
      percentage,
    })

    fs.writeFileSync(filePath, result.data)
    console.log(
      `Optimized: ${filePath} (${formatBytes(originalSize)} → ${formatBytes(
        optimizedSize
      )}, saved ${formatBytes(reduction)} (${percentage.toFixed(2)}%)`
    )
  } catch (error) {
    console.error(`Failed to process ${filePath}:`, error)
  }
}

/**
 * Print comprehensive optimization report.
 */
function printOptimizationReport(): void {
  console.log('\n=== SVG Optimization Report ===')
  console.log(`Total files processed: ${globalStats.totalFiles}`)
  console.log(
    `Total original size: ${formatBytes(globalStats.totalOriginalSize)}`
  )
  console.log(
    `Total optimized size: ${formatBytes(globalStats.totalOptimizedSize)}`
  )

  const totalReduction =
    globalStats.totalOriginalSize - globalStats.totalOptimizedSize
  const totalPercentage = (totalReduction / globalStats.totalOriginalSize) * 100

  console.log(
    `Total space saved: ${formatBytes(
      totalReduction
    )} (${totalPercentage.toFixed(2)}%)`
  )
  console.log('\nTop 5 best optimizations:')

  // Sort by percentage reduction (descending)
  const sortedStats = [...globalStats.fileStats.entries()]
    .sort((a, b) => b[1].percentage - a[1].percentage)
    .slice(0, 5)

  sortedStats.forEach(([filePath, stats]) => {
    console.log(
      `- ${filePath}: ${formatBytes(stats.originalSize)} → ${formatBytes(
        stats.optimizedSize
      )} (saved ${formatBytes(stats.reduction)}, ${stats.percentage.toFixed(
        2
      )}%)`
    )
  })
}

// Execute optimization
optimizeSvgsInDirectory(targetDir)
printOptimizationReport()
console.log('SVG optimization complete!')
