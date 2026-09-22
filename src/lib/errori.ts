/**
 * Un'operazione sul database può fallire per motivi fuori dal nostro controllo:
 * Safari in navigazione privata, spazio esaurito, database bloccato da un'altra scheda.
 * Qui le eccezioni diventano frasi che dicono all'utente cosa è successo e cosa può fare.
 */

/** `azione` completa la frase "Non sono riuscito a ...": es. "salvare il movimento". */
export function messaggioErrore(e: unknown, azione: string): string {
  const nome = (e as { name?: string } | null)?.name ?? ''
  const inizio = `Non sono riuscito a ${azione}.`

  switch (nome) {
    case 'QuotaExceededError':
      return `${inizio} Lo spazio sul dispositivo è esaurito: libera spazio, poi riprova.`
    case 'InvalidStateError':
    case 'UnknownError':
      return `${inizio} Il database locale non è accessibile. In Safari, la navigazione privata non permette di salvare i dati.`
    case 'VersionError':
    case 'BlockedError':
      return `${inizio} L'app è aperta in un'altra scheda: chiudila e riprova.`
    case 'ConstraintError':
      return `${inizio} Questo dato risulta già presente.`
    default:
      return `${inizio} Riprova; se succede ancora, salva un backup e ricarica l'app.`
  }
}

/** Esegue `operazione` segnalando l'errore con un toast. `true` = riuscita. */
export async function conAvviso(
  operazione: () => Promise<unknown>,
  azione: string,
  errore: (testo: string) => void,
): Promise<boolean> {
  try {
    await operazione()
    return true
  } catch (e) {
    console.error(`Errore durante: ${azione}`, e)
    errore(messaggioErrore(e, azione))
    return false
  }
}
