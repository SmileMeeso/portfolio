import { createFileRoute } from '@tanstack/react-router'
import ImageFilterPage from '../components/imageFilter/ImageFilterPage'

export const Route = createFileRoute('/image-filter')({
  component: ImageFilterPage,
})
