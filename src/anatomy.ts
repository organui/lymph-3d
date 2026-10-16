export type Source = { file: string; node: string }
export type Structure = {
  id: string
  // Terms the HRA ASCT+B to 3D crosswalk assigns to this structure's nodes.
  ontologyIds: string[]
  name: string
  sourceName: string
  group: 'Lymph node' | 'Lymphatic vessels' | 'Blood vessels'
  // Named nodes in the HRA reference-organ GLB; each belongs to exactly one structure.
  sources: Source[]
  color: string
  description: string
  note: string
}

const node = (name: string): Source[] => [{ file: 'NIH_M_Lymph_Node.glb', node: name }]

export const anatomySource =
  'https://training.seer.cancer.gov/anatomy/lymphatic/components/nodes.html'
export const structures: Structure[] = [
  {
    id: 'capsule',
    ontologyIds: ['UBERON:0002194'],
    name: 'Capsule',
    sourceName: 'capsule of lymph node',
    group: 'Lymph node',
    sources: node('Yao_capsule_of_lymph_node'),
    color: '#d8c3a5',
    description:
      'A tough layer of connective tissue that wraps the whole node. Strands from it run inward and divide the node into compartments.',
    note: 'Hidden at the start so the inside of the node can be seen. Select it in the anatomy panel and use Show structure.',
  },
  {
    id: 'follicles',
    ontologyIds: ['UBERON:0010748'],
    name: 'Follicles',
    sourceName: 'lymph node follicle',
    group: 'Lymph node',
    sources: node('Yao_follicles'),
    color: '#8a6bb8',
    description:
      'Round clusters of B cells in the outer cortex. When they meet an antigen they form germinal centres and start making antibodies.',
    note: 'The source has no separate outer cortex or germinal centre meshes.',
  },
  {
    id: 'paracortex',
    ontologyIds: ['UBERON:0010417'],
    name: 'Paracortex',
    sourceName: 'lymph node T cell domain',
    group: 'Lymph node',
    sources: node('Yao_paracortex'),
    color: '#5a8fbf',
    description:
      'The deeper cortex, between the follicles and the medulla. It is rich in T cells, which meet antigen-presenting cells here.',
    note: '',
  },
  {
    id: 'medulla',
    ontologyIds: ['UBERON:0002007'],
    name: 'Medulla',
    sourceName: 'medulla of lymph node',
    group: 'Lymph node',
    sources: node('Yao_medulla_of_lymph_node'),
    color: '#e0a383',
    description:
      'The inner part of the node, made of medullary cords of plasma cells and macrophages and the sinuses that carry lymph towards the hilum.',
    note: '',
  },
  {
    id: 'afferent-vessels',
    ontologyIds: ['UBERON:0010396'],
    name: 'Afferent lymphatic vessels',
    sourceName: 'afferent lymphatic vessel',
    group: 'Lymphatic vessels',
    sources: node('Yao_afferent_lymphatic_vessel'),
    color: '#9cc77f',
    description:
      'Small vessels that bring lymph into the node through its curved outer surface. The lymph then filters through the sinuses.',
    note: 'Real nodes usually have several afferent vessels; the model shows the ones the atlas segmented.',
  },
  {
    id: 'efferent-vessel',
    ontologyIds: ['UBERON:0010397'],
    name: 'Efferent lymphatic vessel',
    sourceName: 'efferent lymphatic vessel',
    group: 'Lymphatic vessels',
    sources: node('Yao_efferent_lymph_node'),
    color: '#3f9c8a',
    description:
      'Carries filtered lymph out of the node at the hilum, the dent in its side, onwards to the next node and eventually back to the blood.',
    note: 'The source names this node "efferent lymph node"; the crosswalk maps it to the efferent lymphatic vessel.',
  },
  {
    id: 'blood-vessels',
    ontologyIds: ['UBERON:0004536'],
    name: 'Blood vessels',
    sourceName: 'blood vasculature (crosswalk label: lymph vasculature)',
    group: 'Blood vessels',
    sources: node('Yao_blood_vasculature'),
    color: '#c4545a',
    description:
      'An artery and vein enter and leave at the hilum and branch through the node. Lymphocytes leave the blood into the node through these vessels.',
    note: 'The source node is named blood vasculature, while the crosswalk labels it lymph vasculature (UBERON:0004536). It is shown as blood vessels, following the source name.',
  },
]
export const groups = ['Lymph node', 'Lymphatic vessels', 'Blood vessels'] as const
export const byId = Object.fromEntries(structures.map((s) => [s.id, s]))
export type View = 'Front' | 'Hilum' | 'Side'
// The capsule encloses everything else; the anatomy panel and Restore all show it.
export const initiallyHidden = ['capsule']
export const tour: { id: string; title: string; text: string; view: View; isolate?: boolean }[] = [
  {
    id: 'capsule',
    title: 'A small filter',
    text: 'Hundreds of lymph nodes sit along the lymphatic vessels. Each is a bean-shaped organ, usually under 2 cm long, wrapped in a capsule. This model is shown enlarged.',
    view: 'Front',
  },
  {
    id: 'afferent-vessels',
    title: 'Lymph comes in',
    text: 'Afferent vessels pierce the curved surface and empty lymph into the sinuses under the capsule.',
    view: 'Front',
  },
  {
    id: 'follicles',
    title: 'B cells in the cortex',
    text: 'Follicles in the outer cortex hold B cells. Meeting an antigen, they multiply and begin making antibodies.',
    view: 'Front',
    isolate: true,
  },
  {
    id: 'paracortex',
    title: 'T cells in the paracortex',
    text: 'Deeper in, the paracortex is where T cells meet the cells that bring antigen in from the tissues.',
    view: 'Side',
  },
  {
    id: 'medulla',
    title: 'The medulla',
    text: 'Cords of plasma cells and macrophages line the medullary sinuses, which gather lymph towards the hilum.',
    view: 'Side',
  },
  {
    id: 'efferent-vessel',
    title: 'Lymph goes out',
    text: 'Seen from the hilum, the efferent vessel leaves beside the artery and vein, carrying the filtered lymph onwards.',
    view: 'Hilum',
  },
]

export type Emphasis = 'normal' | 'selected' | 'ghosted'
// With nothing selected every structure keeps its own color. A selection
// keeps its structure solid and ghosts the rest so it stays visible even
// when it sits behind or inside other geometry.
export function emphasis(id: string, selected: string | null): Emphasis {
  if (!selected) return 'normal'
  return id === selected ? 'selected' : 'ghosted'
}
