/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/intro/TreeModelSimple.tsx
// Phiên bản không dùng Merged/Instances để test và gỡ lỗi.

import * as THREE from 'three';
import React, { useMemo, memo } from 'react'; // Thêm memo
import { useGLTF } from '@react-three/drei';
import { GLTF } from 'three-stdlib';
import { a as animated, SpringValue } from '@react-spring/three';

// Định nghĩa kiểu cho kết quả GLTF
// Cấu trúc này phải khớp với file GLB của bạn
type GLTFResult = GLTF & {
  nodes: {
    mesh_0: THREE.Mesh; // Giả sử đây là thân cây
    mesh_0_1: THREE.Mesh; // Giả sử đây là lá cây
    // Thêm các nodes khác nếu model của bạn có nhiều phần hơn
  };
  materials: {
    // THAY THẾ BẰNG TÊN MATERIAL THỰC TẾ TỪ FILE GLB CỦA BẠN
    // Ví dụ: 'Vỏ_Cây_Mat', 'Lá_Cây_Mat'
    // Bạn có thể tìm tên chính xác bằng cách console.log(materials)
    ActualTrunkMaterialName: THREE.MeshStandardMaterial;
    ActualLeafMaterialName: THREE.MeshStandardMaterial;
    // Hoặc nếu chỉ có một material chung, ví dụ:
    // DefaultMaterial: THREE.MeshStandardMaterial;
  };
};

// Props cho component Model để nhận spring values
interface TreeModelSimpleExtraProps {
  trunkEmissiveIntensity?: number | SpringValue<number>;
  leafEmissiveIntensity?: number | SpringValue<number>;
  visible?: boolean;
}

type TreeModelSimpleProps = TreeModelSimpleExtraProps &
  JSX.IntrinsicElements['group'];

export const TreeModelSimple = memo(
  ({
    trunkEmissiveIntensity = 0.05,
    leafEmissiveIntensity = 0.1,
    visible = true,
    ...props
  }: TreeModelSimpleProps) => {
    // Đường dẫn đến file GLB đã được transform (nếu có) hoặc file GLB gốc
    // Đảm bảo file này nằm trong thư mục `public`
    const gltfPath = '/models/my_tree_otp-transformed.glb'; //
    const { nodes, materials } = useGLTF(gltfPath) as GLTFResult;

    // Log ra để kiểm tra cấu trúc nodes và materials
    console.log('TreeModelSimple Loaded Nodes:', nodes);
    console.log('TreeModelSimple Loaded Materials:', materials);
    console.log(
      'TreeModelSimple Loaded trunkEmissiveIntensity:',
      trunkEmissiveIntensity
    );
    console.log(
      'TreeModelSimple Loaded leafEmissiveIntensity:',
      leafEmissiveIntensity
    );
    console.log('TreeModelSimple Loaded props:', props);

    // --- QUAN TRỌNG: THAY THẾ CÁC TÊN MATERIAL DƯỚI ĐÂY ---
    // Lấy material cho thân cây. Thay 'ActualTrunkMaterialName' bằng tên đúng.
    const trunkMat = materials.ActualTrunkMaterialName;
    // Lấy material cho lá cây. Thay 'ActualLeafMaterialName' bằng tên đúng.
    const leafMat = materials.ActualLeafMaterialName;
    // --- KẾT THÚC PHẦN CẦN THAY THẾ TÊN MATERIAL ---

    // Fallback material nếu tên material không đúng hoặc không tìm thấy
    const fallbackMaterial = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: 'magenta', // Màu dễ thấy để biết đang dùng fallback
          wireframe: true, // Wireframe để thấy hình khối
          name: 'FallbackMaterialSimple',
        }),
      []
    );

    // Kiểm tra và log nếu material không được tìm thấy
    if (!trunkMat) {
      console.warn(
        `TreeModelSimple: Trunk material 'ActualTrunkMaterialName' not found. Using fallback. Available materials:`,
        Object.keys(materials)
      );
    }
    if (!leafMat) {
      console.warn(
        `TreeModelSimple: Leaf material 'ActualLeafMaterialName' not found. Using fallback. Available materials:`,
        Object.keys(materials)
      );
    }

    const currentTrunkMat = trunkMat || fallbackMaterial;
    const currentLeafMat = leafMat || fallbackMaterial;

    if (!visible) {
      return null;
    }

    return (
      <group {...props} dispose={null}>
        {/* Thân Cây - Giả sử là nodes.mesh_0 */}
        {nodes.mesh_0 && (
          <animated.mesh
            castShadow
            receiveShadow
            geometry={nodes.mesh_0.geometry}
            // Gán material trực tiếp, không cần attach nếu không ghi đè instance material
          >
            <animated.meshStandardMaterial
              // Sử dụng các thuộc tính từ currentTrunkMat đã được xác định
              map={currentTrunkMat.map}
              color={'#c97e63'}
              roughness={
                currentTrunkMat.roughness !== undefined
                  ? currentTrunkMat.roughness
                  : 0.85
              }
              metalness={
                currentTrunkMat.metalness !== undefined
                  ? currentTrunkMat.metalness
                  : 0.1
              }
              // Emissive được điều khiển bởi spring
              emissive={currentTrunkMat.emissive}
              emissiveIntensity={trunkEmissiveIntensity}
              // Các thuộc tính khác nếu có trong material gốc
              normalMap={currentTrunkMat.normalMap}
              aoMap={currentTrunkMat.aoMap}
              // ...
            />
          </animated.mesh>
        )}

        {/* Lá Cây - Giả sử là nodes.mesh_1 */}
        {nodes.mesh_0_1 && (
          <animated.mesh
            castShadow // Cân nhắc tắt nếu quá nặng
            receiveShadow
            geometry={nodes.mesh_0_1.geometry}
          >
            <animated.meshStandardMaterial
              map={currentLeafMat.map}
              color={currentLeafMat.color}
              roughness={
                currentLeafMat.roughness !== undefined
                  ? currentLeafMat.roughness
                  : 0.75
              }
              metalness={
                currentLeafMat.metalness !== undefined
                  ? currentLeafMat.metalness
                  : 0.02
              }
              emissive={'#ffc0cb'}
              emissiveIntensity={leafEmissiveIntensity}
              // Thuộc tính quan trọng cho lá
              transparent={true}
              alphaMap={currentLeafMat.alphaMap || currentLeafMat.map} // Nếu texture chính có alpha, hoặc dùng alphaMap riêng
              alphaTest={0.45} // Điều chỉnh để có cạnh lá đẹp
              depthWrite={false} // Rất quan trọng
              side={THREE.DoubleSide}
              // Các thuộc tính khác nếu có
              normalMap={currentLeafMat.normalMap}
              // ...
            />
          </animated.mesh>
        )}
        {/* Thêm các mesh khác của cây nếu có, ví dụ nodes.mesh_2, nodes.mesh_3 ... */}
      </group>
    );
  }
);
TreeModelSimple.displayName = 'TreeModelSimple';

// Preload file GLTF
// Đảm bảo đường dẫn này khớp với đường dẫn trong useGLTF
useGLTF.preload('/models/my_tree_otp-transformed.glb'); // << THAY ĐỔI NẾU CẦN
