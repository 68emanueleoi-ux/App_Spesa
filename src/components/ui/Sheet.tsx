import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode, RefObject } from 'react'
import { cn } from '@/lib/cn'

interface SheetProps {
  aperto: boolean
  onChiudi: () => void
  titolo: string
  children: ReactNode
  className?: string
  /** elemento da mettere a fuoco all'apertura (default: il primo focalizzabile) */
  focusIniziale?: RefObject<HTMLElement | null>
}

/**
 * Pannello modale accessibile (focus intrappolato, Esc, scroll bloccato) costruito su Radix Dialog.
 * Su smartphone sale dal basso; su desktop è una finestra centrata.
 */
export function Sheet({ aperto, onChiudi, titolo, children, className, focusIniziale }: SheetProps) {
  return (
    <Dialog.Root open={aperto} onOpenChange={(o) => !o && onChiudi()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(27,33,48,0.45)] data-[state=open]:animate-[velo_200ms_ease-out] dark:bg-[rgba(0,0,0,0.55)]" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            if (focusIniziale?.current) {
              e.preventDefault()
              focusIniziale.current.focus()
            }
          }}
          className={cn(
            'fixed z-50 flex flex-col bg-foglio text-inchiostro shadow-[0_-8px_30px_rgba(0,0,0,0.15)] outline-none',
            // smartphone: dal basso
            'inset-x-0 bottom-0 max-h-[calc(100dvh-24px)] rounded-t-sheet pb-[max(20px,env(safe-area-inset-bottom))] data-[state=open]:animate-[sale_250ms_cubic-bezier(0.2,0.8,0.2,1)]',
            // desktop: centrato
            'md:inset-auto md:top-1/2 md:left-1/2 md:w-[480px] md:max-h-[calc(100dvh-48px)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-sheet md:pb-6 md:data-[state=open]:animate-[appare_200ms_ease-out]',
            className,
          )}
        >
          <div className="mx-auto mt-2.5 mb-3 h-1 w-9 rounded-full bg-filetto md:hidden" aria-hidden="true" />
          <Dialog.Title className="sr-only">{titolo}</Dialog.Title>
          <div className="overflow-y-auto px-5 md:px-6 md:pt-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
