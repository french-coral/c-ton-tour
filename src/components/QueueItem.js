import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export default function QueueItem({ entry, onDelete, onChangeLapCount }) {

  // useSortable gives everything needed to make this one row draggable (with a fucking mobile)
  const sortable = useSortable({ id: entry.id })

  // This builds the actual CSS transform that moves the row visually while it is being dragged
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  }

  return (
    <div
        ref={sortable.setNodeRef}
        style={style}
        className="flex items-center gap-3 border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2 bg-white dark:bg-gray-900"
        >
        <div
            {...sortable.attributes}
            {...sortable.listeners}
            className="text-gray-400 cursor-grab px-1">

            ⠿

        </div>

        <div className="flex-1">
            <p className="font-medium text-sm">{entry.riderName}</p>
        </div>

        <input
            type="number"
            min="1"
            value={entry.lapCount}
            onChange={function (e) {
                onChangeLapCount(entry.id, Number(e.target.value))
            }}
            className="w-14 border border-gray-200 dark:border-gray-700 rounded-lg p-1 text-sm text-center"
        />

        <p className="text-sm font-medium">~ {entry.etaText}</p>

        <button
            onClick={function () { onDelete(entry.id) }}
            aria-label="Supprimer"
            className="text-gray-400 hover:text-red-500 px-1">

            ✕

        </button>

    </div>
  )
}