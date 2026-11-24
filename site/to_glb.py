"""Convert the Osmium V1 CAD STLs into one named, smooth-shaded GLB for the web.
Units: 1 three.js unit = 100 mm (device = 1.9 x 0.84 x 0.175). Front face toward +Z, centred."""
import trimesh, numpy as np
from pathlib import Path
SRC = Path("/home/claude/osmium/out")
PARTS = ["osmium_front_shell", "osmium_back_cover", "int_display", "int_battery_a", "int_battery_b", "int_mainboard",
         "int_soc", "int_vapor_chamber", "int_fan", "int_fin_stack", "int_ctrl_pcb_l", "int_ctrl_pcb_r",
         "int_speaker_l", "int_speaker_r", "int_stick_l_module", "int_stick_r_module", "int_stick_l_cap",
         "int_stick_r_cap", "int_dpad", "int_abxy"]
scene = trimesh.Scene()
T = np.eye(4); T[:3, :3] *= 0.01; T[2, 3] = -8.75 * 0.01
tot = 0
for p in PARTS:
    m = trimesh.load(SRC / f"{p}.stl")
    m.merge_vertices()
    m.apply_transform(T)
    m = trimesh.graph.smooth_shade(m, angle=np.radians(35))
    name = p.replace("osmium_", "").replace("int_", "")
    scene.add_geometry(m, node_name=name, geom_name=name)
    tot += len(m.faces)
    print(f"{name:20s} {len(m.faces):7d} tris")
print("total tris", tot)
scene.export("osmium_v1.glb", include_normals=True)
