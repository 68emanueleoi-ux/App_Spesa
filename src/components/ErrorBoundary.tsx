import { Component, type ErrorInfo, type ReactNode } from 'react'
import { creaBackup } from '@/db/backup'
import { consegnaFile, nomeFileConData } from '@/lib/esporta'

interface Props {
  children: ReactNode
}

interface Stato {
  errore: Error | null
}

/**
 * Ultima rete di sicurezza: senza, un'eccezione in render lascia una pagina bianca
 * e l'unico modo di uscirne sarebbe svuotare i dati del sito, cioè perdere tutto.
 * Qui invece si può ancora salvare un backup prima di ricaricare.
 */
export class ErrorBoundary extends Component<Props, Stato> {
  state: Stato = { errore: null }

  static getDerivedStateFromError(errore: Error): Stato {
    return { errore }
  }

  componentDidCatch(errore: Error, info: ErrorInfo) {
    console.error('Errore non gestito', errore, info.componentStack)
  }

  private salvaBackup = async () => {
    try {
      const b = await creaBackup()
      await consegnaFile(nomeFileConData('spese-backup', 'json'), JSON.stringify(b, null, 2), 'application/json')
    } catch (e) {
      console.error('Backup di emergenza non riuscito', e)
    }
  }

  render() {
    if (!this.state.errore) return this.props.children

    return (
      <div className="mx-auto max-w-[32rem] px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold">Qualcosa è andato storto</h1>
        <p className="mt-2 text-sm text-inchiostro-2">
          I tuoi movimenti sono al sicuro nel database del dispositivo. Salva un backup, poi ricarica l'app.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => void this.salvaBackup()}
            className="h-11 rounded-lg bg-cobalto px-5 text-sm font-bold text-cobalto-testo active:brightness-95"
          >
            Salva un backup
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-11 rounded-lg border border-filetto px-5 text-sm font-medium"
          >
            Ricarica l'app
          </button>
        </div>
        <p className="mt-6 text-xs text-inchiostro-2">{this.state.errore.message}</p>
      </div>
    )
  }
}
