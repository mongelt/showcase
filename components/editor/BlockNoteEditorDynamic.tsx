import dynamic from 'next/dynamic'
import Loader from '../Loader'

// Dynamic import with SSR disabled for BlockNote editor
const BlockNoteEditor = dynamic(
  () => import('./BlockNoteEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full flex items-center justify-center py-10">
        <Loader />
      </div>
    )
  }
)

export default BlockNoteEditor
