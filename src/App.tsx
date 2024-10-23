import React, { useRef, useState } from 'react'
import { Stage, Layer, Line, Circle, Image as KonvaImage } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import useImage from 'use-image'
import Konva from 'konva'

interface IShape {
  points: number[]
  closed: boolean
  fill?: string | null
}

const PolygonDrawer: React.FC = () => {
  const [shapes, setShapes] = useState<IShape[]>([])
  const [currentPoints, setCurrentPoints] = useState<number[]>([])
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [fillColor, setFillColor] = useState<string | null>(null)
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
  const radius = 10
  const [isClosed, setIsClosed] = useState<boolean>(false)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [image] = useImage(imageUrl)
  const stageRef = useRef<Konva.Stage>(null)
  const inputImageRef = useRef<HTMLInputElement>(null)

  const getDistance = (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

  const isCloseToPoint = (x: number, y: number) =>
    currentPoints.some((_, i) => i % 2 === 0 && getDistance(x, y, currentPoints[i], currentPoints[i + 1]) < radius)

  const isCloseToFirstPoint = (x: number, y: number) => currentPoints.length >= 2 && getDistance(x, y, currentPoints[0], currentPoints[1]) < radius

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (selectedPointIndex !== null) return
    const stage = e.target.getStage()
    if (!stage) return
    const pointerPosition = stage.getPointerPosition()
    if (!pointerPosition) return
    const { x, y } = pointerPosition
    if (isCloseToFirstPoint(x, y)) {
      setIsClosed(true)
      return
    }
    if (isCloseToPoint(x, y)) return
    setCurrentPoints((prevPoints) => [...prevPoints, x, y])
  }

  const finishDrawing = () => {
    if (currentPoints.length > 2) {
      setShapes((prevShapes) => [...prevShapes, { points: currentPoints, closed: isClosed, fill: fillColor }])
    }
    setCurrentPoints([])
    setIsDrawing(false)
    setIsClosed(false)
  }

  const startDrawing = () => {
    setIsDrawing(true)
    setCurrentPoints([])
    setSelectedPointIndex(null)
    setIsClosed(false)
  }

  const handlePointDragStart = (index: number) => {
    setSelectedPointIndex(index)
  }

  const handlePointDragEnd = () => {
    setSelectedPointIndex(null)
  }

  const handlePointDrag = (index: number, e: KonvaEventObject<DragEvent>) => {
    const { x, y } = e.target.position()
    const updatedPoints = [...currentPoints]
    updatedPoints[index * 2] = x
    updatedPoints[index * 2 + 1] = y
    setCurrentPoints(updatedPoints)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImageUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const downloadImage = (uri: string, name: string) => {
    const link = document.createElement('a')
    link.download = name
    link.href = uri
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const saveImage = () => {
    const uri = stageRef.current?.toDataURL()
    if (uri) downloadImage(uri, 'canvas-image.png')
  }

  const ResetButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => <button onClick={onClick}>{label}</button>

  const clearCurrentPoints = () => {
    setCurrentPoints([])
    setIsDrawing(false)
    setIsClosed(false)
  }

  const clearShapes = () => {
    setShapes([])
  }

  const clearCover = () => {
    setImageUrl('')
    if (inputImageRef.current) {
      inputImageRef.current.value = ''
    }
  }

  const resetImage = () => {
    stageRef.current?.clear()
    setImageUrl('')
    if (inputImageRef.current) {
      inputImageRef.current.value = ''
    }
    setShapes([])
    setCurrentPoints([])
    setIsDrawing(false)
    setIsClosed(false)
  }

  return (
    <div>
      <Stage width={500} height={500} onMouseDown={isDrawing ? handleClick : undefined} ref={stageRef}>
        <Layer>
          {image && <KonvaImage image={image} width={500} height={500} />}
          {shapes.map((shape, index) => (
            <Line key={index} points={shape.points} stroke='black' strokeWidth={2} fill={shape.fill || undefined} closed={shape.closed} />
          ))}
          {currentPoints.length > 0 && (
            <>
              <Line points={currentPoints} stroke='black' strokeWidth={2} fill={fillColor || undefined} closed={isClosed} />
              {currentPoints
                .filter((_, index) => index % 2 === 0)
                .map((_, i) => (
                  <Circle
                    key={i}
                    x={currentPoints[i * 2]}
                    y={currentPoints[i * 2 + 1]}
                    radius={5}
                    fill='red'
                    draggable
                    onDragStart={() => handlePointDragStart(i)}
                    onDragMove={(e) => handlePointDrag(i, e)}
                    onDragEnd={handlePointDragEnd}
                  />
                ))}
            </>
          )}
        </Layer>
      </Stage>
      <button onClick={startDrawing} disabled={isDrawing}>
        Start Drawing
      </button>
      <button onClick={finishDrawing} disabled={!isDrawing || !currentPoints.length}>
        Finish Drawing
      </button>
      <input type='file' accept='image/*' onChange={handleImageUpload} ref={inputImageRef} />
      <button onClick={saveImage}>Save Image</button>
      <ResetButton onClick={clearCurrentPoints} label='Clear current points' />
      <ResetButton onClick={clearShapes} label='Clear all shapes' />
      <ResetButton onClick={clearCover} label='Clear cover' />
      <ResetButton onClick={resetImage} label='Reset image' />
      <div>
        <label>
          Fill color:
          <select onChange={(e) => setFillColor(e.target.value === 'none' ? null : e.target.value)} defaultValue='none'>
            <option value='none'>No fill</option>
            <option value='rgba(0, 128, 255, 0.5)'>Blue transparent</option>
            <option value='lightgreen'>Light Green</option>
            <option value='yellow'>Yellow</option>
          </select>
        </label>
      </div>
    </div>
  )
}

export default PolygonDrawer
