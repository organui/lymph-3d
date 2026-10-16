import { mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Document, NodeIO } from '@gltf-transform/core'
import { BufferGeometry, Color, Float32BufferAttribute, Matrix4, Vector3 } from 'three'
import inputs from './model-inputs.json'
import { structures } from '../src/anatomy'

const sha = (data: Uint8Array) => createHash('sha256').update(data).digest('hex')
const raw = (path: string) =>
  `https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/${inputs.commit}/${path}`
await mkdir('.asset-cache/hra', { recursive: true })
await mkdir('public/models', { recursive: true })
for (const input of inputs.files) {
  const file = Bun.file(`.asset-cache/hra/${input.file}`)
  if (!(await file.exists())) {
    console.log(`Downloading ${input.file}…`)
    const response = await fetch(raw(input.path))
    if (!response.ok) throw new Error(`${input.file}: HTTP ${response.status}`)
    await Bun.write(file, response)
  }
  if (sha(new Uint8Array(await file.arrayBuffer())) !== input.sha256) {
    throw new Error(
      `Checksum mismatch: ${input.file}. Refusing changed upstream data; review it before updating the pin.`,
    )
  }
}

// The official ASCT+B to 3D crosswalk names every node and its ontology term.
const crosswalkBytes = new Uint8Array(await Bun.file(inputs.crosswalk.file).arrayBuffer())
if (sha(crosswalkBytes) !== inputs.crosswalk.sha256) throw new Error('Official crosswalk changed')
const rows = new TextDecoder()
  .decode(crosswalkBytes)
  .split(/\r?\n/)
  .map((line) => line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, '')))
const header = rows.findIndex((r) => r[0] === 'anatomical_structure_of')
const crosswalk = new Map(
  rows
    .slice(header + 1)
    .filter((r) => r[6] === 'NIH_M_Lymph_Node')
    .map((r) => [r[2], { label: r[3], ontologyId: r[4], file: r[6] }]),
)

const io = new NodeIO()
const sources = new Map<string, Document>()
for (const input of inputs.files)
  sources.set(input.file, await io.read(`.asset-cache/hra/${input.file}`))

const doc = new Document()
doc.getRoot().getAsset().copyright =
  'HuBMAP Human Reference Atlas 3D Reference Object Library (Kristen Browne, Heidi Schlehlein et al.), CC BY 4.0. Adapted by OrganUI.'
const scene = doc.createScene('OrganUI Lymph Node — HRA 3D reference lymph node')
const buffer = doc.createBuffer()
const used = new Set<string>()
const min = [Infinity, Infinity, Infinity],
  max = [-Infinity, -Infinity, -Infinity]
const prepared = []
for (const structure of structures) {
  const positions: number[] = [],
    indices: number[] = []
  const nodes = []
  const terms = new Set<string>()
  for (const { file, node: name } of structure.sources) {
    const key = `${file}#${name}`
    if (used.has(key)) throw new Error(`Duplicate ownership: ${key}`)
    used.add(key)
    const entry = crosswalk.get(name)
    if (!entry) throw new Error(`${name} is not a crosswalk node`)
    const node = sources
      .get(file)!
      .getRoot()
      .listNodes()
      .find((n) => n.getName() === name)
    const mesh = node?.getMesh()
    if (!node || !mesh) throw new Error(`Missing mesh node ${key}`)
    if (entry.ontologyId !== '-') terms.add(entry.ontologyId)
    const matrix = new Matrix4().fromArray(node.getWorldMatrix())
    let vertices = 0,
      triangles = 0
    for (const primitive of mesh.listPrimitives()) {
      if (primitive.getMode() !== 4) throw new Error(`Non-triangle primitive: ${key}`)
      const position = primitive.getAttribute('POSITION')!
      const offset = positions.length / 3
      const v = new Vector3()
      for (let i = 0; i < position.getCount(); i++) {
        v.fromArray(position.getElement(i, [])).applyMatrix4(matrix)
        if (![v.x, v.y, v.z].every(Number.isFinite)) throw new Error(`Invalid vertex: ${key}`)
        v.toArray().forEach((p, axis) => {
          min[axis] = Math.min(min[axis], p)
          max[axis] = Math.max(max[axis], p)
        })
        positions.push(v.x, v.y, v.z)
      }
      const index = primitive.getIndices()?.getArray()
      const faces = index ? Array.from(index) : [...Array(position.getCount()).keys()]
      indices.push(...faces.map((i) => i + offset))
      vertices += position.getCount()
      triangles += faces.length / 3
    }
    if (!vertices || !triangles) throw new Error(`Empty mesh: ${key}`)
    nodes.push({
      file,
      node: name,
      label: entry.label,
      ontologyId: entry.ontologyId,
      vertices,
      triangles,
    })
  }
  const expected = [...structure.ontologyIds].sort().join()
  if ([...terms].sort().join() !== expected)
    throw new Error(`Ontology terms for ${structure.id} do not match the crosswalk: ${[...terms]}`)
  prepared.push({ structure, positions, indices, nodes })
}
const available = [...sources].flatMap(([file, d]) =>
  d
    .getRoot()
    .listNodes()
    .filter((n) => n.getMesh())
    .map((n) => `${file}#${n.getName()}`),
)
console.log(`Using ${used.size} of ${available.length} source mesh nodes`)

const center = min.map((v, i) => (v + max[i]) / 2)
// Metres to display units. A node is about 2 cm long, so it is magnified to 0.1 per
// millimetre (about six times the 0.016 the whole-organ explorers use) to give a
// similar on-screen size and stay well inside the camera's near plane.
const scale = 100
for (const { structure, positions, indices } of prepared) {
  const transformed = new Float32Array(positions.length)
  for (let i = 0; i < positions.length; i++) transformed[i] = (positions[i] - center[i % 3]) * scale
  const geometry = new BufferGeometry()
    .setAttribute('position', new Float32BufferAttribute(transformed, 3))
    .setIndex(indices)
  geometry.computeVertexNormals()
  const color = new Color(structure.color)
  const material = doc
    .createMaterial(structure.id)
    .setBaseColorFactor([color.r, color.g, color.b, 1])
    .setRoughnessFactor(0.65)
    .setMetallicFactor(0)
    .setDoubleSided(true)
  const primitive = doc
    .createPrimitive()
    .setAttribute(
      'POSITION',
      doc.createAccessor().setType('VEC3').setArray(transformed).setBuffer(buffer),
    )
    .setAttribute(
      'NORMAL',
      doc
        .createAccessor()
        .setType('VEC3')
        .setArray(new Float32Array(geometry.getAttribute('normal').array))
        .setBuffer(buffer),
    )
    .setIndices(
      doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(indices)).setBuffer(buffer),
    )
    .setMaterial(material)
  const mesh = doc.createMesh(structure.id).addPrimitive(primitive)
  scene.addChild(
    doc
      .createNode(structure.id)
      .setMesh(mesh)
      .setExtras({
        structureId: structure.id,
        ontologyIds: structure.ontologyIds,
        sources: structure.sources.map((s) => s.node),
      }),
  )
  geometry.dispose()
}
const runtime = await io.writeBinary(doc)
await Bun.write('public/models/lymph-node.glb', runtime)
const manifest = {
  dataset: 'HuBMAP Human Reference Atlas 3D Reference Object Library (male reference lymph node)',
  retrieved: '2026-10-16',
  license: 'CC-BY-4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  credit: doc.getRoot().getAsset().copyright,
  repository: inputs.repository,
  commit: inputs.commit,
  crosswalk: inputs.crosswalk,
  sources: inputs.files.map(({ file, path, title, doi, sha256, bytes }) => ({
    file,
    path,
    title,
    doi,
    sha256,
    bytes,
  })),
  transform: { sourceBoundsM: { min, max }, centerM: center, scale, axes: '[x, y, z]' },
  runtime: { file: 'lymph-node.glb', bytes: runtime.byteLength, sha256: sha(runtime) },
  structures: prepared.map(({ structure, nodes }) => ({
    id: structure.id,
    ontologyIds: structure.ontologyIds,
    sourceName: structure.sourceName,
    nodes,
  })),
}
await Bun.write('public/models/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
await Bun.write(
  'docs/model-source/selected-nodes.tsv',
  'structure\tsource file\tnode\tcrosswalk label\tontology id\ttriangles\n' +
    prepared
      .flatMap(({ structure, nodes }) =>
        nodes.map((n) =>
          [structure.id, n.file, n.node, n.label, n.ontologyId, n.triangles].join('\t'),
        ),
      )
      .join('\n') +
    '\n',
)
console.log(
  `Prepared ${structures.length} structures from ${used.size} source nodes, ${runtime.byteLength} bytes. SHA-256 ${sha(runtime)}`,
)
