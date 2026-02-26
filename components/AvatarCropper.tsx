import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';

interface AvatarCropperProps {
    imageSrc: string;
    onCancel: () => void;
    onConfirm: (croppedBase64: string) => void;
    t: any;
}

/**
 * 头像裁剪组件（基于 react-easy-crop 库）
 *
 * NOTE: 使用成熟开源库替代手搓实现，彻底避免预览变形、
 * 手势兼容性等问题。支持拖拽平移、双指/滚轮缩放、圆形预览。
 * 导出 256x256 JPEG。
 */
const AvatarCropper: React.FC<AvatarCropperProps> = ({ imageSrc, onCancel, onConfirm, t }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    /**
     * 裁剪区域变化回调
     * react-easy-crop 会精确计算出原图上的像素坐标
     */
    const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    /**
     * 从原图裁剪并导出 base64
     * 用 Canvas 绘制裁剪区域到 256x256 输出
     */
    const handleConfirm = useCallback(async () => {
        if (!croppedAreaPixels) return;

        const image = new window.Image();
        image.src = imageSrc;
        await new Promise<void>((resolve) => {
            image.onload = () => resolve();
        });

        const OUTPUT_SIZE = 256;
        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0, 0,
            OUTPUT_SIZE,
            OUTPUT_SIZE
        );

        onConfirm(canvas.toDataURL('image/jpeg', 0.85));
    }, [croppedAreaPixels, imageSrc, onConfirm]);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-2xl border-4 border-black overflow-hidden flex flex-col shadow-neo">
                {/* 标题栏 */}
                <header className="bg-dopa-pink border-b-4 border-black p-3 text-center">
                    <h3 className="font-black text-lg text-white uppercase">
                        {t.settings?.cropTitle || '裁剪头像'}
                    </h3>
                </header>

                {/* 裁剪区域 */}
                <div className="relative w-full h-[350px] bg-gray-900">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={true}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        minZoom={1}
                        maxZoom={5}
                        zoomSpeed={0.3}
                        objectFit="contain"
                    />
                </div>

                {/* 缩放指示器 */}
                <div className="px-4 py-3 border-b-4 border-black bg-gray-50 flex items-center gap-3">
                    <span className="text-sm shrink-0">🔍</span>
                    <input
                        type="range"
                        min={1}
                        max={5}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-black h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-500 w-10 text-right">
                        {Math.round(zoom * 100)}%
                    </span>
                </div>

                {/* 操作按钮 */}
                <div className="flex bg-white">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 font-black text-gray-600 border-r-4 border-black active:bg-gray-100 uppercase"
                    >
                        {t.settings?.cancel || '取消'}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-4 font-black bg-dopa-lime active:bg-green-400 active:translate-y-0.5 transition-colors uppercase select-none"
                    >
                        {t.settings?.confirmCrop || '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarCropper;
