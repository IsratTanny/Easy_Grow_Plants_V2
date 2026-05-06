# Expanded Plant Care Folder Hierarchy

This update adds significant depth to the data organization.

/src/data/plants/
├── plants.json       <-- Comprehensive Data File (Includes all below)
├── Pothos/
│   └── ... (Existing)
├── Aglaonema/
│   └── ... (Existing)
├── Calathea/         <-- NEW
│   ├── Medallion/
│   ├── Rattlesnake/
│   └── Ornata/
├── Philodendron/     <-- NEW
│   ├── Heartleaf/
│   ├── Brasil/
│   └── Pink_Princess/
├── Peperomia/        <-- NEW
│   ├── Watermelon/
│   ├── Hope/
│   └── Raindrop/
├── Ficus/            <-- NEW
│   ├── Fiddle_Leaf_Fig/
│   ├── Rubber_Plant/
│   └── Audrey/
├── Dracaena/         <-- NEW
│   ├── Marginata/
│   └── Lemon_Lime/
├── Begonia/          <-- NEW
│   ├── Rex/
│   └── Maculata/
├── Alocasia/         <-- NEW
│   ├── Polly/
│   ├── Black_Velvet/
│   └── Zebrina/
├── Tradescantia/     <-- NEW
│   ├── Zebrina/
│   └── Nanouk/
└── General_Care_Only_Species/ <-- Grouped logically, handled as "Varieties = []" in JSON
    ├── Anthurium/
    ├── Syngonium/
    ├── Dieffenbachia/
    ├── ZZ_Plant/
    └── Fittonia/
