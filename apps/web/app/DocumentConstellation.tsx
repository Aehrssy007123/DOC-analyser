"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Line } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Graph({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * 0.08; });
  const points = Array.from({ length: Math.max(count, 4) }, (_, i) => {
    const angle = (i / Math.max(count, 4)) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * 1.45, Math.sin(angle * 1.7) * 0.65, Math.sin(angle) * 1.05);
  });
  return <group ref={group}>
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.25}><mesh><icosahedronGeometry args={[0.28, 2]} /><meshStandardMaterial color="#c4f36b" emissive="#506b25" emissiveIntensity={0.5} /></mesh></Float>
    {points.map((point, index) => <group key={index}><Line points={[[0, 0, 0], point.toArray()]} color={index % 3 === 0 ? "#ff9d60" : "#66717d"} transparent opacity={0.55} lineWidth={1} /><mesh position={point}><sphereGeometry args={[index % 3 === 0 ? 0.13 : 0.1, 16, 16]} /><meshStandardMaterial color={index % 3 === 0 ? "#ff9d60" : "#9aa7b3"} /></mesh></group>)}
  </group>;
}

export default function DocumentConstellation({ count }: { count: number }) {
  return <div className="constellation"><Canvas camera={{ position: [0, 0, 4.6], fov: 42 }}><ambientLight intensity={1.4} /><pointLight position={[3, 3, 4]} intensity={10} color="#c4f36b" /><Graph count={count} /><OrbitControls enablePan={false} enableZoom={false} /></Canvas><span>STRUCTURE MAP · DRAG TO ROTATE</span></div>;
}
