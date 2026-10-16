# Model provenance and preparation

## Source and license

BodyParts3D, which most OrganUI explorers use, has no lymph nodes or lymphatic vessels: neither the 4.3 OBJ mirror nor the 3.0 STL mirror lists any (the 3.0 parts list has only the thymus under "lymphoid system"). This explorer therefore uses the **HuBMAP Human Reference Atlas (HRA) 3D Reference Object Library** reference lymph node, as the [uterus explorer](https://github.com/organui/uterus-3d) does for organs BodyParts3D lacks.

The model is **[3D Reference Organ for Lymph Node, Male v1.2](https://doi.org/10.48539/HBM299.VVXH.634)** by Kristen Browne and Heidi Schlehlein (HuBMAP ID HBM299.VVXH.634, reviewed by Marda Jorgensen). Its [release page](model-source/ref-organ-lymph-node-male.md), copied unchanged from ccf-releases, states **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**. That license governs `public/models/lymph-node.glb`, the manifest's model data and the model screenshots, separately from the MIT application code. Attribution and the modification notice are in [ATTRIBUTION.md](../public/models/ATTRIBUTION.md).

The release page says the model was made with the clearing-enhanced 3D (Ce3D) imaging method from Weizhe Li's NIAID laboratory, using data documented in [PNAS 114(35):E7321](https://www.pnas.org/content/114/35/E7321), and that "while the size and cellular composition of mouse and human lymph nodes varies between species, the overall anatomy is well-conserved". The explorer therefore presents it as a general lymph node, not as a measured human node, and says so in the about dialog and README.

## Retrieval and pinning

The sandbox's network policy blocks `cdn.humanatlas.io`, so the GLB comes from the atlas's GitHub library, [hubmapconsortium/ccf-3d-reference-object-library](https://github.com/hubmapconsortium/ccf-3d-reference-object-library), pinned at commit `f1a3a63f110e27ff0736047d52d04dba5d3087f9` (`VH_Male/v1.2/NIH_M_Lymph_Node.glb`, the same commit uterus-3d pins). Its Git blob (`5c8fd0b2…`) is identical to `v1.2/models/` and `v1.3/models/NIH_M_Lymph_Node.glb` in [ccf-releases](https://github.com/hubmapconsortium/ccf-releases) at commit `b036a91`.

The file's SHA-256 is pinned in [model-inputs.json](../scripts/model-inputs.json); `prepare-model.ts` refuses to run if it changes. Every node used must appear in the official ASCT+B to 3D crosswalk ([`asct-b-3d-models-crosswalk.csv`](model-source/asct-b-3d-models-crosswalk.csv), v1.5, from ccf-releases `v2.0/models/` at commit `b036a91`, SHA-256 `3c39c2d1…0b7f80`, the same file uterus-3d pins) under `NIH_M_Lymph_Node`, and each structure's ontology terms must equal the crosswalk's.

## Selected structures

| Structure | Source node | Crosswalk label and term | Triangles |
| --- | --- | --- | --- |
| Capsule | Yao_capsule_of_lymph_node | capsule of lymph node, UBERON:0002194 | 9,442 |
| Follicles | Yao_follicles | lymph node follicle, UBERON:0010748 | 5,758 |
| Paracortex | Yao_paracortex | lymph node T cell domain, UBERON:0010417 | 10,910 |
| Medulla | Yao_medulla_of_lymph_node | medulla of lymph node, UBERON:0002007 | 88,388 |
| Afferent lymphatic vessels | Yao_afferent_lymphatic_vessel | afferent lymphatic vessel, UBERON:0010396 | 4,526 |
| Efferent lymphatic vessel | Yao_efferent_lymph_node | efferent lymphatic vessel, UBERON:0010397 | 4,154 |
| Blood vessels | Yao_blood_vasculature | Lymph vasculature, UBERON:0004536 | 131,485 |

All 7 mesh nodes of the file are used, 254,663 triangles. The parent node `Yao_lymph_node` (crosswalk: mesenteric lymph node, UBERON:0002509) has no mesh. Per-node labels, terms and counts are also in the [manifest](../public/models/manifest.json) and [selected-nodes.tsv](model-source/selected-nodes.tsv).

Decisions:

- **Blood vessels.** The source node is named `Yao_blood_vasculature` and shows an artery and vein entering at the hilum and branching through the node, but the crosswalk labels it "Lymph vasculature". It is shown as blood vessels, following the source name and the geometry; the term and the discrepancy are recorded in the structure's note.
- **Capsule starts hidden** because it encloses everything else. Restore all and the anatomy panel show it, and the first tour stop shows it.
- **No sinuses, outer cortex or germinal centres.** The source has no separate meshes for them; the cortex is represented by the follicles and paracortex.
- **Male v1.2 rather than female.** The male and female HRA lymph nodes are made from the same imaging; the male file has the finer meshes (7.4 MB against 4.5 MB).
- **Not a whole-body lymphatic map.** Neither BodyParts3D nor the HRA library has the body's lymph node chains, lymphatic trunks or thoracic duct, so the explorer shows one node in detail. The thymus and tonsils are lymphoid organs too but belong to other explorers.

## Transformation and orientation

The source is in metres, Y-up. Vertices are recentred on the selection's bounding box (18.3 × 10.7 × 13.0 mm) and uniformly scaled by `100` (0.1 per millimetre, about six times the 0.016 the whole-organ explorers use, so the node fills a similar part of the screen and stays clear of the camera's near plane). Axes are unchanged. The hilum, where the efferent vessel and blood vessels attach, faces +Y.

Views: **Front** looks along −Z with the hilum at the top and the afferent vessel below; **Hilum** looks down onto the hilum from above and slightly in front; **Side** looks along −X. Source vertex colours are dropped and normals recomputed. No anatomical reshaping or decimation is performed.

## Reproduce

```sh
bun run prepare:model   # downloads the GLB into .asset-cache/hra if missing, verifies, writes the GLB and manifest
bun run verify:model    # checks the GLB hash, structure IDs, node lists and geometry
```
