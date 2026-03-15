import { createFileRoute } from '@tanstack/react-router'
import ImageOptimizePage from '../components/imageOptimize/ImageOptimizePage'

export const Route = createFileRoute('/image-optimize')({
  component: ImageOptimizePage,
})
