import React, { useRef, useState } from 'react'
import { Stage, Layer, Line, Circle, Image as KonvaImage } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import useImage from 'use-image' // Хук для работы с изображениями
import Konva from 'konva'

// Определяем тип для фигуры
interface IShape {
  points: number[]
  closed: boolean // Указывает, замкнута ли фигура
  fill?: string | null // Цвет заливки или null, если без заливки
}

const PolygonDrawer: React.FC = () => {
  const [shapes, setShapes] = useState<IShape[]>([]) // Массив всех фигур
  const [currentPoints, setCurrentPoints] = useState<number[]>([]) // Текущая фигура
  const [isDrawing, setIsDrawing] = useState<boolean>(false) // Флаг рисования
  const [fillColor, setFillColor] = useState<string | null>(null) // Цвет заливки или null
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null) // Индекс выбранной точки для редактирования
  const radius = 10 // Радиус, в пределах которого клик не добавляет новую точку
  const [isClosed, setIsClosed] = useState<boolean>(false) // Флаг для замыкания фигуры
  const [imageUrl, setImageUrl] = useState<string>('') // URL фонового изображения
  const [image] = useImage(imageUrl) // Загруженное фоновое изображение
  const stageRef = useRef<Konva.Stage>(null) // Для сохранения изображения
  const inputImageRef = useRef<HTMLInputElement>(null)

  // Функция для проверки, близко ли мы к существующей точке
  const isCloseToPoint = (x: number, y: number) => {
    for (let i = 0; i < currentPoints.length; i += 2) {
      const px = currentPoints[i]
      const py = currentPoints[i + 1]
      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
      if (distance < radius) {
        return true // Клик слишком близко к существующей точке
      }
    }
    return false
  }

  // Проверка на то, совпадает ли текущая точка с первой
  const isCloseToFirstPoint = (x: number, y: number) => {
    if (currentPoints.length < 2) return false // Если еще нет первой точки, возвращаем false
    const firstX = currentPoints[0]
    const firstY = currentPoints[1]
    const distance = Math.sqrt((x - firstX) ** 2 + (y - firstY) ** 2)
    return distance < radius // Если точка близко к первой
  }

  // Функция для добавления точек при клике
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (selectedPointIndex !== null) return

    const stage = e.target.getStage()
    if (!stage) return

    const pointerPosition = stage.getPointerPosition()
    if (!pointerPosition) return

    const { x, y } = pointerPosition

    // Если клик близко к первой точке, замыкаем фигуру, но не завершаем рисование
    if (isCloseToFirstPoint(x, y)) {
      setIsClosed(true) // Флаг, что фигура замкнута
      return
    }

    // Проверяем, близко ли к существующей точке
    if (isCloseToPoint(x, y)) return

    // Добавляем новую точку
    setCurrentPoints((prevPoints) => [...prevPoints, x, y])
  }

  // Функция для завершения рисования текущей фигуры и сохранения её в массив
  const finishDrawing = () => {
    if (currentPoints.length > 2) {
      setShapes((prevShapes) => [...prevShapes, { points: currentPoints, closed: isClosed, fill: fillColor }])
    }
    setCurrentPoints([]) // Очищаем текущую фигуру
    setIsDrawing(false) // Останавливаем рисование
    setIsClosed(false) // Сбрасываем замыкание
  }

  // Функция для начала рисования новой фигуры
  const startDrawing = () => {
    setIsDrawing(true)
    setCurrentPoints([]) // Очищаем текущие точки
    setSelectedPointIndex(null) // Очищаем выбор точки
    setIsClosed(false) // Сбрасываем замыкание для новой фигуры
  }

  // Функция для начала перетаскивания точки
  const handlePointDragStart = (index: number) => {
    setSelectedPointIndex(index)
  }

  // Функция для завершения перетаскивания точки
  const handlePointDragEnd = () => {
    setSelectedPointIndex(null) // Сбрасываем выбор точки после перетаскивания
  }

  // Функция для изменения координат точки (drag)
  const handlePointDrag = (index: number, e: KonvaEventObject<DragEvent>) => {
    const { x, y } = e.target.position()
    const updatedPoints = [...currentPoints]
    updatedPoints[index * 2] = x // Обновляем координату X
    updatedPoints[index * 2 + 1] = y // Обновляем координату Y
    setCurrentPoints(updatedPoints)
  }

  // Функция для загрузки изображения с локального компьютера
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

  // Функция для сохранения изображения
  const saveImage = () => {
    const uri = stageRef.current?.toDataURL()
    const link = document.createElement('a')
    link.download = 'canvas-image.png'
    link.href = uri ? uri : ''
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Функции для сброса текущей фигуры и всех фигур, а также фона и всего изображения

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
      <Stage
        width={500}
        height={500}
        onMouseDown={isDrawing ? handleClick : undefined} // Добавляем точки при клике, если включен режим рисования
        ref={stageRef} // Сохраняем ссылку на элемент Stage
      >
        <Layer>
          {/* Отрисовываем фоновое изображение */}
          {image && <KonvaImage image={image} width={500} height={500} />}

          {/* Отрисовываем все ранее созданные фигуры */}
          {shapes.map((shape, index) => (
            <Line
              key={index}
              points={shape.points}
              stroke='black'
              strokeWidth={2}
              fill={shape.fill || undefined} // Цвет заливки или undefined, если без заливки
              closed={shape.closed} // Используем ключ closed для замкнутой фигуры
            />
          ))}

          {/* Отрисовываем текущую фигуру */}
          {currentPoints.length > 0 && (
            <>
              <Line
                points={currentPoints}
                stroke='black'
                strokeWidth={2}
                fill={fillColor || undefined} // Цвет заливки или без заливки
                closed={isClosed} // Устанавливаем замкнутость фигуры
              />
              {/* Отрисовываем точки для редактирования */}
              {currentPoints.map(
                (point, index) =>
                  index % 2 === 0 && (
                    <Circle
                      key={index}
                      x={currentPoints[index]}
                      y={currentPoints[index + 1]}
                      radius={5}
                      fill='red'
                      draggable // Всегда можно перетаскивать точки
                      onDragStart={() => handlePointDragStart(index / 2)} // Начало перетаскивания
                      onDragMove={(e) => handlePointDrag(index / 2, e)} // Обработка перемещения точки
                      onDragEnd={handlePointDragEnd} // Завершение перетаскивания
                    />
                  )
              )}
            </>
          )}
        </Layer>
      </Stage>

      {/* Кнопки для начала и завершения рисования */}
      <button onClick={startDrawing} disabled={isDrawing}>
        Start Drawing
      </button>
      <button onClick={finishDrawing} disabled={!isDrawing || !currentPoints.length}>
        Finish Drawing
      </button>
      {/* Кнопка для загрузки фонового изображения */}
      <input type='file' accept='image/*' onChange={handleImageUpload} ref={inputImageRef} />

      {/* Кнопка для сохранения изображения */}
      <button onClick={saveImage}>Save Image</button>

      <button onClick={clearCurrentPoints}>Clear current points</button>

      <button onClick={clearShapes}>Clear all shapes</button>

      <button onClick={clearCover}>Clear cover</button>

      <button onClick={resetImage}>Reset image</button>

      {/* Выбор заливки */}
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
