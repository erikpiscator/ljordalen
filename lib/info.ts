import "server-only";
import { db } from "./firebase";

const INFO_DOC = () => db.collection("settings").doc("cabinInfo");

const DEFAULT_INFO = `Välkommen till stugan!

Lägg det praktiska som alla behöver veta här, till exempel:

- Var nyckeln finns
- Wifi-namn & lösenord
- Hur värmen / vattnet fungerar
- Vad man bör ta med
- Trivselregler (lämna stugan som du önskar finna den!)`;

export async function getCabinInfo(): Promise<string> {
  const snap = await INFO_DOC().get();
  const content = snap.exists
    ? (snap.data() as { content?: string }).content
    : undefined;
  return content ?? DEFAULT_INFO;
}

export async function setCabinInfo(content: string): Promise<void> {
  await INFO_DOC().set({ content, updatedAt: Date.now() }, { merge: true });
}
