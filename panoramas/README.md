# Como adicionar seus tours 360°

1. **Obtenha imagens equirectangulares**  
   - Câmeras 360° (Insta360, Ricoh, etc.) ou  
   - Stitch de várias fotos no drone/app (ex.: DJI, Litchi, etc.)

2. **Coloque as imagens nesta pasta**  
   Exemplo: `panoramas/salao.jpg`, `panoramas/area-externa.jpg`

3. **Edite `js/tour.js`**  
   Troque a URL do panorama:
   ```javascript
   panorama: 'panoramas/salao.jpg',
   ```

4. **Vários cômodos (multicena)**  
   No `tour.js` você pode usar a opção `scenes` do Pannellum:
   ```javascript
   pannellum.viewer('panorama', {
     default: {
       firstScene: 'salao',
     },
     scenes: {
       salao: {
         type: 'equirectangular',
         panorama: 'panoramas/salao.jpg',
         hotSpots: [
           { yaw: 0, pitch: 0, type: 'scene', text: 'Área externa', sceneId: 'externa' }
         ]
       },
       externa: {
         type: 'equirectangular',
         panorama: 'panoramas/externa.jpg',
         hotSpots: [
           { yaw: 0, pitch: 0, type: 'scene', text: 'Voltar ao salão', sceneId: 'salao' }
         ]
       }
     }
   });
   ```

Documentação completa: [pannellum.org](https://pannellum.org/documentation/overview/)
