import cv2 as cv
import numpy as np

Winname = "Image:"

def nothing(x):
    pass

# Create a window and trackbars for HSV range selection
cv.namedWindow(Winname)
# H, S, V for lower boundaries
cv.createTrackbar('H', Winname, 0, 255, nothing)
cv.createTrackbar('S', Winname, 0, 255, nothing)
cv.createTrackbar('V', Winname, 0, 255, nothing)
# H2, S2, V2 for upper boundaries
cv.createTrackbar('H2', Winname, 0, 255, nothing)
cv.createTrackbar('S2', Winname, 0, 255, nothing)
cv.createTrackbar('V2', Winname, 0, 255, nothing)

# Load an image from file (update 'image_path' with your actual image file path)
image_path = './test.png'
image = cv.imread(image_path)

# Check if the image loaded properly
if image is None:
    print("Error loading image.")
    exit()

# Convert the image to the HSV color space
hsv = cv.cvtColor(image, cv.COLOR_BGR2HSV)

while True:
    # Get the current trackbar positions for the lower and upper boundaries
    H = cv.getTrackbarPos('H', Winname)
    S = cv.getTrackbarPos('S', Winname)
    V = cv.getTrackbarPos('V', Winname)
    H2 = cv.getTrackbarPos('H2', Winname)
    S2 = cv.getTrackbarPos('S2', Winname)
    V2 = cv.getTrackbarPos('V2', Winname)

    # Define the lower and upper HSV boundaries
    lower_boundary = np.array([H, S, V])
    upper_boundary = np.array([H2, S2, V2])

    # Create a mask based on the HSV range
    mask = cv.inRange(hsv, lower_boundary, upper_boundary)

    # Apply the mask to the original image
    result = cv.bitwise_and(image, image, mask=mask)

    # Display the result
    cv.imshow(Winname, result)

    # Break the loop when 'q' is pressed
    if cv.waitKey(1) == ord('q'):
        break

# Clean up and close windows
cv.destroyAllWindows()
