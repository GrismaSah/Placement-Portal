import React from "react";
import { Link } from "react-router-dom";
import { categoryIcon, categoryLabel } from "../../constants/jobTaxonomy";

const MAX_TILES = 8;

const PopularCategories = ({ categories = [] }) => {
  // Already sorted by count on the server; cap so the grid keeps its shape.
  const tiles = categories.slice(0, MAX_TILES);

  if (tiles.length === 0) return null;

  return (
    <div className="categories">
      <h3>POPULAR CATEGORIES</h3>
      <div className="banner">
        {tiles.map((element) => {
          const Icon = categoryIcon(element.name);
          return (
            <Link
              className="card"
              key={element.name}
              to={`/job/getall?category=${encodeURIComponent(element.name)}`}
            >
              <div className="icon">
                <Icon />
              </div>
              <div className="text">
                <p>{categoryLabel(element.name)}</p>
                <p>
                  {element.count} {element.count === 1 ? "Opening" : "Openings"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default PopularCategories;
