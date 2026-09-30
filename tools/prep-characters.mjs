// Trims the downloaded Quaternius character GLBs (CC0, poly.pizza) down to what the game uses:
// the mesh + skeleton and three clips (Idle, Walk, Run), renamed to those short names.
//
// Usage (needs @gltf-transform/core and @gltf-transform/functions installed somewhere, e.g. a scratch dir):
//   node tools/prep-characters.mjs <source-dir> <out-dir>
// where <source-dir> holds man.glb, woman.glb, tank.glb and dress.glb as downloaded from poly.pizza.
import { NodeIO } from '@gltf-transform/core';
import { prune } from '@gltf-transform/functions';
import path from 'node:path';

const [src, out] = process.argv.slice(2);
if (!src || !out) throw new Error('usage: node prep-characters.mjs <source-dir> <out-dir>');

const KEEP = { Idle: /_Idle$/, Walk: /_Walk$/, Run: /_Run$/ };
const io = new NodeIO();

for (const name of ['man', 'woman', 'tank', 'dress']) {
  const doc = await io.read(path.join(src, name + '.glb'));
  const root = doc.getRoot();
  for (const anim of root.listAnimations()) {
    const short = Object.keys(KEEP).find((k) => KEEP[k].test(anim.getName()));
    if (short) anim.setName(short);
    else {
      // Samplers keep their keyframe accessors alive, so free them too or prune() cannot drop the data.
      anim.listChannels().forEach((c) => c.dispose());
      anim.listSamplers().forEach((s) => s.dispose());
      anim.dispose();
    }
  }
  await doc.transform(prune());
  // Drop accessors (keyframe data of the removed clips) that nothing references any more.
  root.listAccessors()
    .filter((a) => a.listParents().every((p) => p.propertyType === 'Root'))
    .forEach((a) => a.dispose());
  await io.write(path.join(out, name + '.glb'), doc);
  console.log(name, root.listAnimations().map((a) => a.getName()).join(','));
}
