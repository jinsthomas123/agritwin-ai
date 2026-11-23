
import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

function CardamomPlant({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.18, 0.24, 0.3, 8]} />
        <meshStandardMaterial color="#493523" />
      </mesh>

      {Array.from({ length: 7 }).map((_, i) => {
        const angle = (i / 7) * Math.PI * 2;

        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 0.35,
              0.65 + (i % 3) * 0.12,
              Math.sin(angle) * 0.35
            ]}
            rotation={[
              Math.sin(angle) * 0.45,
              angle,
              Math.cos(angle) * 0.55
            ]}
          >
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#36a852" : "#65bd55"}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function ShadeTree({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.13, 0.2, 2, 8]} />
        <meshStandardMaterial color="#65432d" />
      </mesh>

      <mesh position={[0, 2.3, 0]}>
        <sphereGeometry args={[1.05, 12, 12]} />
        <meshStandardMaterial color="#285f35" />
      </mesh>

      <mesh position={[0.5, 2.5, 0.2]}>
        <sphereGeometry args={[0.65, 12, 12]} />
        <meshStandardMaterial color="#397b3e" />
      </mesh>
    </group>
  );
}

function FarmZone({
  x,
  z,
  name,
  color,
  zoneId,
  selected,
  onSelect
}) {
  return (
    <group position={[x, 0.03, z]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(zoneId);
        }}
      >
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial
          color={selected ? "#43d98b" : color}
          transparent
          opacity={selected ? 0.42 : 0.16}
          side={2}
        />
      </mesh>

      <Text
        position={[0, 0.2, -3.7]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.65}
        color={selected ? "#aaffcc" : "white"}
        anchorX="center"
      >
        {name}
      </Text>

      {Array.from({ length: 12 }).map((_, i) => (
        <CardamomPlant
          key={i}
          position={[
            -2.8 + (i % 4) * 1.8,
            0,
            -2 + Math.floor(i / 4) * 1.8
          ]}
          scale={0.85}
        />
      ))}
    </group>
  );
}

function FarmScene({ selectedZone, onZoneSelect }) {
  return (
    <>
      <color attach="background" args={["#101d17"]} />

      <ambientLight intensity={1.2} />

      <directionalLight
  position={[8, 12, 6]}
  intensity={2}
/>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.08, 0]}
        receiveShadow
      >
        <planeGeometry args={[45, 45]} />
        <meshStandardMaterial color="#315d35" />
      </mesh>

      <FarmZone
        x={-5}
        z={-5}
        name="NORTH ZONE"
        color="#43d98b"
        zoneId={1}
        selected={selectedZone === 1}
        onSelect={onZoneSelect}
      />

      <FarmZone
        x={5}
        z={-5}
        name="SOUTH ZONE"
        color="#4db8a5"
        zoneId={2}
        selected={selectedZone === 2}
        onSelect={onZoneSelect}
      />

      <FarmZone
        x={-5}
        z={5}
        name="EAST ZONE"
        color="#8bcf62"
        zoneId={3}
        selected={selectedZone === 3}
        onSelect={onZoneSelect}
      />

      <FarmZone
        x={5}
        z={5}
        name="WEST ZONE"
        color="#b4c85c"
        zoneId={4}
        selected={selectedZone === 4}
        onSelect={onZoneSelect}
      />

      <ShadeTree position={[-12, 0, -10]} />
      <ShadeTree position={[12, 0, -10]} />
      <ShadeTree position={[-12, 0, 10]} />
      <ShadeTree position={[12, 0, 10]} />
      <ShadeTree position={[0, 0, -12]} />
      <ShadeTree position={[0, 0, 12]} />

      <gridHelper
        args={[45, 45, "#587c57", "#405e45"]}
      />

      <OrbitControls
        makeDefault
        minDistance={8}
        maxDistance={35}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}

export default function Farm3D({
  selectedZone = 1,
  onZoneSelect = () => {}
}) {
  return (
    <div style={{
      width: "100%",
      height: "550px",
      background: "#101d17",
      borderRadius: "15px",
      overflow: "hidden",
      border: "1px solid #234333"
    }}>
    <Canvas
  dpr={[1, 1.5]}
  camera={{
    position: [18, 19, 22],
    fov: 45
  }}
>
        <FarmScene
          selectedZone={selectedZone}
          onZoneSelect={onZoneSelect}
        />
      </Canvas>
    </div>
  );
}
